"""
Document Processing Service

Handles document uploads, text extraction, and AI-powered analysis
for supplier risk assessment.
"""
import os
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

from fastapi import UploadFile
from pypdf import PdfReader
from sqlalchemy.orm import Session

from src.db.models import Supplier
from src.agents.orchestrator import (
    FinancialAgent, LegalAgent, ESGAgent, GeopoliticalAgent
)
from src.services.contract_risk_matrix import ContractRiskMatrix


class DocumentProcessingService:
    """Service for processing uploaded documents and extracting risk insights."""

    def __init__(self, upload_dir: str = "uploaded_documents"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)

    async def process_document(
        self,
        file: UploadFile,
        supplier_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Process uploaded document and run AI analysis.

        Args:
            file: Uploaded file
            supplier_id: ID of supplier this document relates to
            db: Database session

        Returns:
            Analysis results with risk insights
        """
        # Get supplier
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found")

        # Save file
        file_path = await self._save_file(file, supplier_id)

        # Extract text
        text_content = await self._extract_text(file_path)

        # Analyze with AI agents
        analysis_results = await self._analyze_with_agents(
            text_content,
            supplier,
            file.filename,
            db
        )

        return {
            "file_name": file.filename,
            "file_path": str(file_path),
            "supplier_id": supplier_id,
            "supplier_name": supplier.name,
            "text_length": len(text_content),
            "processed_at": datetime.now().isoformat(),
            "analysis": analysis_results
        }

    async def _save_file(self, file: UploadFile, supplier_id: int) -> Path:
        """Save uploaded file to disk."""
        # Create supplier-specific directory
        supplier_dir = self.upload_dir / f"supplier_{supplier_id}"
        supplier_dir.mkdir(exist_ok=True)

        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = supplier_dir / safe_filename

        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return file_path

    async def _extract_text(self, file_path: Path) -> str:
        """Extract text from PDF document."""
        try:
            if file_path.suffix.lower() == '.pdf':
                return self._extract_text_from_pdf(file_path)
            elif file_path.suffix.lower() == '.txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                # For other file types, return basic info
                return f"Document: {file_path.name} (type: {file_path.suffix})"
        except Exception as e:
            return f"Error extracting text: {str(e)}"

    def _extract_text_from_pdf(self, file_path: Path) -> str:
        """Extract text from PDF file."""
        reader = PdfReader(file_path)
        text_parts = []

        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            text_parts.append(f"--- Page {page_num} ---\n{text}\n")

        return "\n".join(text_parts)

    async def _analyze_with_agents(
        self,
        text_content: str,
        supplier: Supplier,
        filename: str,
        db: Session
    ) -> Dict[str, Any]:
        """Run AI agents on document content."""
        # Initialize agents
        financial_agent = FinancialAgent(db)
        legal_agent = LegalAgent(db)
        esg_agent = ESGAgent(db)
        geopolitical_agent = GeopoliticalAgent(db)

        # Prepare context for analysis
        context = {
            "document_type": self._infer_document_type(filename, text_content),
            "supplier_name": supplier.name,
            "supplier_region": supplier.region,
            "supplier_category": supplier.category
        }

        # First, if this is a contract, analyze using contract risk matrix
        contract_analysis = None
        if context["document_type"] == "contract":
            # Analyze from cafe (buyer) perspective
            contract_analysis = ContractRiskMatrix.analyze_contract_text(
                text_content,
                perspective="buyer"
            )

        # Run agents in parallel
        results = {}

        # Financial Analysis
        try:
            financial_result = await financial_agent.analyze_document(
                text_content,
                supplier,
                context
            )
            results["financial"] = financial_result
        except Exception as e:
            results["financial"] = {"error": str(e)}

        # Legal Analysis
        try:
            legal_result = await legal_agent.analyze_document(
                text_content,
                supplier,
                context
            )
            results["legal"] = legal_result
        except Exception as e:
            results["legal"] = {"error": str(e)}

        # ESG Analysis
        try:
            esg_result = await esg_agent.analyze_document(
                text_content,
                supplier,
                context
            )
            results["esg"] = esg_result
        except Exception as e:
            results["esg"] = {"error": str(e)}

        # Geopolitical Analysis
        try:
            geo_result = await geopolitical_agent.analyze_document(
                text_content,
                supplier,
                context
            )
            results["geopolitical"] = geo_result
        except Exception as e:
            results["geopolitical"] = {"error": str(e)}

        # Generate summary
        summary = self._generate_summary(results, context, contract_analysis)

        response = {
            "agent_results": results,
            "summary": summary,
            "document_context": context
        }

        # Include contract analysis if available
        if contract_analysis:
            response["contract_analysis"] = contract_analysis

        return response

    def _infer_document_type(self, filename: str, text_content: str) -> str:
        """Infer document type from filename and content."""
        filename_lower = filename.lower()
        text_lower = text_content.lower()

        if any(word in filename_lower for word in ['contract', 'agreement', 'msa']):
            return "contract"
        elif any(word in filename_lower for word in ['invoice', 'receipt', 'bill']):
            return "invoice"
        elif any(word in filename_lower for word in ['financial', 'earnings', 'report', '10-k', '10-q']):
            return "financial_report"
        elif any(word in filename_lower for word in ['compliance', 'audit', 'certification']):
            return "compliance_document"
        elif 'esg' in filename_lower or 'sustainability' in filename_lower:
            return "esg_report"
        else:
            return "general"

    def _generate_summary(
        self,
        results: Dict[str, Any],
        context: Dict[str, Any],
        contract_analysis: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate overall summary from agent results and contract analysis."""
        # Calculate average risk score from AI agents
        risk_scores = []
        for agent_name, result in results.items():
            if isinstance(result, dict) and "risk_score" in result:
                risk_scores.append(result["risk_score"])

        avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 50

        # If contract analysis is available, blend it with agent risk scores
        if contract_analysis:
            contract_risk = contract_analysis["overall_risk_score"]
            # Weighted average: 60% contract terms, 40% AI agent analysis
            avg_risk = (contract_risk * 0.6) + (avg_risk * 0.4)

        # Collect all findings
        all_findings = []
        for agent_name, result in results.items():
            if isinstance(result, dict) and "findings" in result:
                all_findings.extend(result["findings"])

        # Add contract-specific findings
        if contract_analysis:
            for term in contract_analysis.get("high_risk_terms", [])[:5]:
                all_findings.append(
                    f"HIGH RISK CONTRACT TERM: {term['term']} (Risk: {term['risk_score']}/10) - {term['rationale']}"
                )

        # Collect all recommendations
        all_recommendations = []
        for agent_name, result in results.items():
            if isinstance(result, dict) and "recommendations" in result:
                all_recommendations.extend(result["recommendations"])

        # Add contract-specific recommendations
        if contract_analysis:
            all_recommendations.extend(contract_analysis.get("recommendations", []))

        # Determine overall recommendation
        if avg_risk < 40:
            recommendation = "Low Risk - Proceed"
        elif avg_risk < 70:
            recommendation = "Medium Risk - Review and Negotiate"
        else:
            recommendation = "High Risk - Exercise Caution or Replace"

        return {
            "overall_risk_score": round(avg_risk, 2),
            "recommendation": recommendation,
            "document_type": context.get("document_type", "unknown"),
            "key_findings": all_findings[:10],  # Top 10 findings
            "key_recommendations": all_recommendations[:5],  # Top 5 recommendations
            "agents_analyzed": list(results.keys()),
            "analyzed_at": datetime.now().isoformat()
        }
