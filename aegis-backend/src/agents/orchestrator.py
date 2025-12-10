"""
Aegis Agent Orchestrator - Coordinates 8 specialized AI agents.

Uses LangGraph for multi-agent orchestration and Google Gemini for analysis.
Each agent specializes in a specific risk dimension and outputs structured scores.
"""
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import google.generativeai as genai  # Keep import but we won't use it directly, actually better to remove if not needed.
# For now, let's remove it and use httpx/requests for Ollama or the ollama library
import requests
import json
from sqlalchemy.orm import Session

from src.db.models import Supplier, Contract, AgentActivity, AgentType
from src.services.risk_scoring_service import RiskScoringService
from src.config import settings

logger = logging.getLogger(__name__)

# Ollama Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

class OllamaClient:
    """Client for interacting with Ollama."""
    
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url
        self.model = model

    def generate_content(self, prompt: str) -> 'OllamaResponse':
        """Generate content using Ollama."""
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json" # Request JSON schema if possible or just expect JSON
                },
                timeout=60
            )
            response.raise_for_status()
            return OllamaResponse(response.json().get("response", ""))
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            raise

class OllamaResponse:
    def __init__(self, text: str):
        self.text = text


class BaseAgent:
    """Base class for all specialized agents."""

    def __init__(self, agent_type: AgentType, db: Session):
        self.agent_type = agent_type
        self.db = db
        # self.model = genai.GenerativeModel("gemini-1.5-flash") # REMOVED
        self.model = OllamaClient() # Use Ollama client

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Analyze supplier/contract and return risk assessment.

        Returns:
            Dictionary with:
                - risk_score: float (0-100)
                - confidence: float (0-1)
                - findings: List[str]
                - recommendations: List[str]
                - risk_factors: Dict
        """
        raise NotImplementedError("Subclasses must implement analyze()")

    def _log_activity(
        self,
        supplier_id: int,
        task_description: str,
        result: Dict,
        status: str = "completed",
        error: Optional[str] = None
    ):
        """Log agent activity to database."""
        activity = AgentActivity(
            agent_type=self.agent_type,
            supplier_id=supplier_id,
            task_description=task_description,
            status=status,
            result=result,
            error_message=error,
            completed_at=datetime.now() if status == "completed" else None,
        )

        self.db.add(activity)
        self.db.commit()
        return activity


class FinancialAgent(BaseAgent):
    """Analyzes financial stability, cash flow, and creditworthiness."""

    def __init__(self, db: Session):
        super().__init__(AgentType.FINANCIAL, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze financial risk."""

        prompt = f"""
You are a financial risk analyst. Analyze the following supplier for financial stability:

Supplier: {supplier.name}
Region: {supplier.region}
Annual Volume: ${supplier.annual_volume:,.2f} if supplier.annual_volume else 'N/A'
Category: {supplier.category}

Assess the following financial risk factors and provide a risk score from 0-100 (0=no risk, 100=extreme risk):

1. **Financial Stability**: Cash flow, liquidity, debt levels
2. **Credit Worthiness**: Payment history, credit rating
3. **Market Position**: Revenue trends, market share
4. **Profitability**: Margins, ROI, financial health

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "cash_flow": "good/moderate/poor",
        "debt_level": "low/moderate/high",
        "profitability": "strong/moderate/weak"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Financial risk analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Financial agent error: {str(e)}")
            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Financial risk analysis for {supplier.name}",
                result={},
                status="failed",
                error=str(e)
            )
            # Return default high-risk result on error
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual financial review"],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        """Parse Gemini JSON response."""
        import json
        import re

        # Extract JSON from markdown code blocks if present
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Fallback parsing
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }

    async def analyze_document(
        self,
        document_text: str,
        supplier: Supplier,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze uploaded document for financial risks."""

        # Limit text to first 10000 characters to avoid token limits
        text_sample = document_text[:10000]

        prompt = f"""
You are a financial risk analyst reviewing documents for supplier risk assessment.

Supplier: {supplier.name}
Document Type: {context.get('document_type', 'unknown')}
Region: {supplier.region}

Analyze the following document excerpt for financial risks:

---
{text_sample}
---

Assess financial risk indicators and provide a risk score from 0-100 (0=no risk, 100=extreme risk).
Focus on: financial stability, cash flow, liquidity, debt, profitability, and market position.

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "cash_flow": "good/moderate/poor",
        "debt_level": "low/moderate/high",
        "profitability": "strong/moderate/weak"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            return self._parse_gemini_response(response.text)
        except Exception as e:
            logger.error(f"Financial document analysis error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Document analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual document review"],
                "risk_factors": {}
            }

#Hippa, Rules, Labor Laws, Compliance
#Make a seperate ComplianceAgent with regarrds to above stuff
#Legal: Limit to court cases
#Brand and Reputation along with Social can be clubbed together

class LegalAgent(BaseAgent):
    """Analyzes legal compliance, contract risks, and regulatory issues."""

    def __init__(self, db: Session):
        super().__init__(AgentType.LEGAL, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze legal risk."""

        contract_info = ""
        if contract:
            contract_info = f"""
Contract Details:
- Contract Number: {contract.contract_number}
- Status: {contract.status.value}
- Value: ${contract.contract_value:,.2f}
- Start Date: {contract.start_date}
- End Date: {contract.end_date}
- Clauses: {len(contract.clauses or [])} clauses
"""

        prompt = f"""
You are a legal risk analyst. Analyze the following supplier for legal and compliance risks:

Supplier: {supplier.name}
Region: {supplier.region}
Country: {supplier.country}
{contract_info}

Assess legal risks including:
1. **Contract Compliance**: Terms, obligations, penalties
2. **Regulatory Compliance**: Industry regulations, local laws
3. **Litigation History**: Past disputes, claims
4. **IP and Data**: Intellectual property, data privacy concerns

Provide a risk score from 0-100 (0=no risk, 100=extreme risk).

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "contract_terms": "favorable/neutral/unfavorable",
        "regulatory_compliance": "compliant/partial/non-compliant",
        "litigation_risk": "low/moderate/high"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Legal risk analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Legal agent error: {str(e)}")
            return self._default_error_result(str(e))

    def _parse_gemini_response(self, text: str) -> Dict:
        """Parse Gemini JSON response."""
        import json
        import re

        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }

    def _default_error_result(self, error: str) -> Dict:
        """Return default result on error."""
        return {
            "risk_score": 50.0,
            "confidence": 0.3,
            "findings": [f"Analysis failed: {error}"],
            "recommendations": ["Conduct manual legal review"],
            "risk_factors": {}
        }

    async def analyze_document(
        self,
        document_text: str,
        supplier: Supplier,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze uploaded document for legal and compliance risks."""

        text_sample = document_text[:10000]

        prompt = f"""
You are a legal risk analyst reviewing documents for supplier risk assessment.

Supplier: {supplier.name}
Document Type: {context.get('document_type', 'unknown')}
Country: {supplier.country}

Analyze the following document excerpt for legal and compliance risks:

---
{text_sample}
---

Assess legal risk indicators and provide a risk score from 0-100 (0=no risk, 100=extreme risk).
Focus on: contract terms, regulatory compliance, litigation risks, IP concerns, and data privacy.

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "contract_terms": "favorable/neutral/unfavorable",
        "regulatory_compliance": "compliant/partial/non-compliant",
        "litigation_risk": "low/moderate/high"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            return self._parse_gemini_response(response.text)
        except Exception as e:
            logger.error(f"Legal document analysis error: {str(e)}")
            return self._default_error_result(str(e))


class ESGAgent(BaseAgent):
    """Analyzes environmental, social, and governance factors."""

    def __init__(self, db: Session):
        super().__init__(AgentType.ESG, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze ESG risk."""

        prompt = f"""
You are an ESG (Environmental, Social, Governance) analyst. Analyze this supplier:

Supplier: {supplier.name}
Region: {supplier.region}
Country: {supplier.country}
Category: {supplier.category}

Assess ESG risks:
1. **Environmental**: Carbon footprint, sustainability practices, waste management
2. **Social**: Labor practices, human rights, community impact
3. **Governance**: Corporate governance, ethics, transparency

Provide a risk score from 0-100 (0=excellent ESG, 100=very poor ESG).

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "environmental": "excellent/good/moderate/poor",
        "social": "excellent/good/moderate/poor",
        "governance": "excellent/good/moderate/poor"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"ESG analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"ESG agent error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": [],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        """Parse Gemini JSON response."""
        import json
        import re

        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }

    async def analyze_document(
        self,
        document_text: str,
        supplier: Supplier,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze uploaded document for ESG risks."""

        text_sample = document_text[:10000]

        prompt = f"""
You are an ESG (Environmental, Social, Governance) analyst reviewing documents for supplier risk assessment.

Supplier: {supplier.name}
Document Type: {context.get('document_type', 'unknown')}
Country: {supplier.country}
Category: {supplier.category}

Analyze the following document excerpt for ESG risks:

---
{text_sample}
---

Assess ESG risk indicators and provide a risk score from 0-100 (0=excellent ESG, 100=very poor ESG).
Focus on: environmental impact, labor practices, human rights, corporate governance, and sustainability.

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "environmental": "excellent/good/moderate/poor",
        "social": "excellent/good/moderate/poor",
        "governance": "excellent/good/moderate/poor"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            return self._parse_gemini_response(response.text)
        except Exception as e:
            logger.error(f"ESG document analysis error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Document analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual ESG review"],
                "risk_factors": {}
            }


class GeopoliticalAgent(BaseAgent):
    """Analyzes geopolitical and climate risks."""

    def __init__(self, db: Session):
        super().__init__(AgentType.GEOPOLITICAL, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze geopolitical risk."""

        prompt = f"""
You are a geopolitical risk analyst. Analyze this supplier:

Supplier: {supplier.name}
Region: {supplier.region}
Country: {supplier.country}

Assess geopolitical risks:
1. **Political Stability**: Government stability, policy changes
2. **Trade Regulations**: Tariffs, sanctions, export controls
3. **Climate Risk**: Natural disasters, climate change impacts
4. **Regional Conflicts**: War, terrorism, civil unrest

Provide a risk score from 0-100.

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "political_stability": "stable/moderate/unstable",
        "trade_risk": "low/moderate/high",
        "climate_risk": "low/moderate/high"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Geopolitical analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Geopolitical agent error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": [],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }

    async def analyze_document(
        self,
        document_text: str,
        supplier: Supplier,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze uploaded document for geopolitical and climate risks."""

        text_sample = document_text[:10000]

        prompt = f"""
You are a geopolitical risk analyst reviewing documents for supplier risk assessment.

Supplier: {supplier.name}
Document Type: {context.get('document_type', 'unknown')}
Country: {supplier.country}
Region: {supplier.region}

Analyze the following document excerpt for geopolitical and climate risks:

---
{text_sample}
---

Assess geopolitical risk indicators and provide a risk score from 0-100 (0=no risk, 100=extreme risk).
Focus on: political stability, trade regulations, sanctions, climate risks, and regional conflicts.

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "political_stability": "stable/moderate/unstable",
        "trade_risk": "low/moderate/high",
        "climate_risk": "low/moderate/high"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            return self._parse_gemini_response(response.text)
        except Exception as e:
            logger.error(f"Geopolitical document analysis error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Document analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual geopolitical review"],
                "risk_factors": {}
            }


# Simpler rule-based agents for remaining categories
class OperationalAgent(BaseAgent):
    """Analyzes operational reliability and delivery risk."""

    def __init__(self, db: Session):
        super().__init__(AgentType.OPERATIONAL, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze operational risk."""

        prompt = f"""
You are an operational risk analyst. Analyze this supplier:

Supplier: {supplier.name}
Region: {supplier.region}
Country: {supplier.country}
Category: {supplier.category}
Annual Volume: ${supplier.annual_volume:,.2f} if supplier.annual_volume else 'N/A'

Assess operational risks:
1. **Delivery Reliability**: History of delays, on-time performance
2. **Capacity**: Ability to meet demand, scalability
3. **Quality Control**: manufacturing defects, quality assurance processes
4. **Supply Chain Resilience**: Single points of failure, backup options

Provide a risk score from 0-100 (0=no risk, 100=extreme risk).

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "delivery_reliability": "high/moderate/low",
        "capacity_risk": "high/moderate/low",
        "quality_control": "strong/moderate/weak"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Operational analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Operational agent error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual operational review"],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }




class PricingAgent(BaseAgent):
    """Analyzes pricing competitiveness and cost risk."""

    def __init__(self, db: Session):
        super().__init__(AgentType.PRICING, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze pricing risk."""

        prompt = f"""
You are a pricing analyst. Analyze this supplier:

Supplier: {supplier.name}
Category: {supplier.category}
Contract Value: ${contract.contract_value:,.2f} if contract and contract.contract_value else 'N/A'

Assess pricing risks:
1. **Competitiveness**: Comparison to market rates
2. **Cost Volatility**: Risk of price increases
3. **Transparency**: Clarity of cost structure
4. **Value for Money**: ROI, total cost of ownership

Provide a risk score from 0-100 (0=excellent pricing, 100=high risk/poor value).

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "competitiveness": "high/moderate/low",
        "volatility": "high/moderate/low",
        "transparency": "good/moderate/poor"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Pricing analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Pricing agent error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": ["Conduct manual pricing review"],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }

#operational_agent.py can be ocmbined with performance_agent.py. 
class SocialAgent(BaseAgent):
    """Analyzes social responsibility and community impact."""

    def __init__(self, db: Session):
        super().__init__(AgentType.SOCIAL, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze social risk."""

        prompt = f"""
You are a social responsibility analyst. Analyze this supplier:

Supplier: {supplier.name}
Region: {supplier.region}
Country: {supplier.country}

Assess social risks:
1. **Labor Practices**: Wages, working conditions, child labor
2. **Community Impact**: Local community relations
3. **Human Rights**: Supply chain transparency, fair treatment
4. **Diversity & Inclusion**: Hiring practices

Provide a risk score from 0-100 (0=excellent social responsibility, 100=high risk).

Respond in JSON format:
{{
    "risk_score": <0-100>,
    "confidence": <0-1>,
    "findings": ["finding 1", "finding 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...],
    "risk_factors": {{
        "labor_practices": "good/moderate/poor",
        "community_impact": "positive/neutral/negative",
        "human_rights": "good/concern"
    }}
}}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_gemini_response(response.text)

            self._log_activity(
                supplier_id=supplier.id,
                task_description=f"Social responsibility analysis for {supplier.name}",
                result=result,
                status="completed"
            )

            return result

        except Exception as e:
            logger.error(f"Social agent error: {str(e)}")
            return {
                "risk_score": 50.0,
                "confidence": 0.3,
                "findings": [f"Analysis failed: {str(e)}"],
                "recommendations": [],
                "risk_factors": {}
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "risk_score": 50.0,
                "confidence": 0.5,
                "findings": [text[:500]],
                "recommendations": [],
                "risk_factors": {}
            }



class ChatAgent:
    """Handles conversational interactions with the user."""

    def __init__(self, db: Session):
        self.db = db
        self.model = OllamaClient() # Use Ollama

    async def chat(self, message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Process a chat message and return a response.
        """
        # Fetch high-level context
        supplier_count = self.db.query(Supplier).count()
        
        # Determine if the user is asking about a specific supplier
        relevant_supplier = None
        suppliers = self.db.query(Supplier).all()
        for s in suppliers:
             if s.name.lower() in message.lower():
                 relevant_supplier = s
                 break
        
        context_str = f"""
You are Aegis, an AI Supply Chain Risk Assistant.
Context:
- There are {supplier_count} active suppliers in the portfolio.
"""
        
        if relevant_supplier:
            context_str += f"""
User is asking about supplier: {relevant_supplier.name}
- Region: {relevant_supplier.region}
- Country: {relevant_supplier.country}
- Category: {relevant_supplier.category}
- Annual Volume: ${relevant_supplier.annual_volume:,.2f}
- Status: {relevant_supplier.status.value}
"""

        prompt = f"""
{context_str}

User Message: "{message}"

Respond helpfully and professionally. If you are recommending an action, suggest it.
If the user asks to analyze a supplier, say you can start an assessment.
Keep the response concise (under 3 sentences unless complex).

Also provide 3 "quick_replies" that the user might want to say next.

Respond in JSON format:
{{
    "response": "text response...",
    "quick_replies": ["reply 1", "reply 2", "reply 3"]
}}
"""
        try:
            response = self.model.generate_content(prompt)
            # Ollama might return just the JSON string, parse it
            return self._parse_gemini_response(response.text)
        except Exception as e:
            logger.error(f"Chat agent error: {str(e)}")
            return {
                "response": "I'm having trouble connecting to my local AI brain right now. Make sure Ollama is running.",
                "quick_replies": []
            }

    def _parse_gemini_response(self, text: str) -> Dict:
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        try:
            # If Ollama returns raw JSON without markdown, this might fail or succeed depending on logic
            # Cleaning up potentially
            text = text.strip()
            if text.startswith('```json'):
                 text = text[7:]
            if text.endswith('```'):
                 text = text[:-3]
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to just load it directly if regex failed
            try:
                return json.loads(text)
            except:
                return {
                    "response": text,
                    "quick_replies": []
                }


class PerformanceAgent(BaseAgent):
    """Analyzes historical performance and quality metrics."""

    def __init__(self, db: Session):
        super().__init__(AgentType.PERFORMANCE, db)

    async def analyze(
        self,
        supplier: Supplier,
        contract: Optional[Contract] = None,
        additional_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Analyze performance risk."""

        risk_score = 35.0

        # Check supplier status
        if supplier.status.value == "Critical":
            risk_score += 30.0
        elif supplier.status.value == "Under Review":
            risk_score += 15.0

        result = {
            "risk_score": min(100.0, risk_score),
            "confidence": 0.75,
            "findings": [
                f"Supplier status: {supplier.status.value}",
                "Historical performance data available"
            ],
            "recommendations": [
                "Monitor KPIs monthly",
                "Set clear performance benchmarks"
            ],
            "risk_factors": {
                "quality": "good" if risk_score < 50 else "needs improvement",
                "on_time_delivery": "good"
            }
        }

        self._log_activity(
            supplier_id=supplier.id,
            task_description=f"Performance analysis for {supplier.name}",
            result=result,
            status="completed"
        )

        return result


class AegisOrchestrator:
    """
    Orchestrates all 8 specialized agents and coordinates their analyses.
    """

    def __init__(self, db: Session):
        self.db = db
        self.risk_scoring_service = RiskScoringService(db)

        # Initialize all agents
        self.agents = {
            "financial": FinancialAgent(db),
            "legal": LegalAgent(db),
            "esg": ESGAgent(db),
            "geopolitical": GeopoliticalAgent(db),
            "operational": OperationalAgent(db),
            "pricing": PricingAgent(db),
            "social": SocialAgent(db),
            "performance": PerformanceAgent(db),
        }
        self.chat_agent = ChatAgent(db)

    async def chat(self, message: str, context: Optional[Dict] = None) -> Dict:
        """Route chat request to ChatAgent."""
        return await self.chat_agent.chat(message, context)

    async def run_full_assessment(
        self,
        supplier_id: int,
        contract_id: Optional[int] = None
    ) -> Dict:
        """
        Run complete risk assessment using all agents.

        Returns comprehensive risk analysis with composite score.
        """
        logger.info(f"Running full assessment for supplier {supplier_id}")

        # Fetch supplier
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")

        # Fetch contract if provided
        contract = None
        if contract_id:
            contract = self.db.query(Contract).filter(Contract.id == contract_id).first()

        # Run all agents in parallel (in real implementation, use asyncio.gather)
        results = {}
        category_scores = {}

        for agent_name, agent in self.agents.items():
            try:
                analysis = await agent.analyze(supplier, contract)
                results[agent_name] = analysis
                category_scores[f"{agent_name}_score"] = analysis["risk_score"]
            except Exception as e:
                logger.error(f"Agent {agent_name} failed: {str(e)}")
                results[agent_name] = {
                    "risk_score": 50.0,
                    "confidence": 0.3,
                    "findings": [f"Analysis failed: {str(e)}"],
                    "recommendations": [],
                    "risk_factors": {}
                }
                category_scores[f"{agent_name}_score"] = 50.0

        # Create risk assessment with composite score
        assessment = self.risk_scoring_service.create_risk_assessment(
            supplier_id=supplier_id,
            category_scores=category_scores,
            contract_id=contract_id,
            confidence_level=sum(r.get("confidence", 0.5) for r in results.values()) / len(results),
            risk_factors=results
        )

        return {
            "assessment_id": assessment.id,
            "supplier_id": supplier_id,
            "supplier_name": supplier.name,
            "composite_score": assessment.composite_score,
            "recommendation": assessment.recommendation,
            "individual_analyses": results,
            "assessed_at": assessment.assessed_at.isoformat(),
        }

    async def run_single_agent(
        self,
        agent_type: str,
        supplier_id: int,
        contract_id: Optional[int] = None
    ) -> Dict:
        """Run a single agent analysis."""

        if agent_type not in self.agents:
            raise ValueError(f"Unknown agent type: {agent_type}")

        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")

        contract = None
        if contract_id:
            contract = self.db.query(Contract).filter(Contract.id == contract_id).first()

        agent = self.agents[agent_type]
        result = await agent.analyze(supplier, contract)

        return {
            "agent_type": agent_type,
            "supplier_id": supplier_id,
            "supplier_name": supplier.name,
            "analysis": result,
        }
