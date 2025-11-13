import os
import google.generativeai as genai
from typing import Dict

# Load environment variable for Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class AegisOrchestrator:
    """
    Coordinates AI agents: Finance, Legal, ESG, etc.
    Now powered by Gemini 1.5 Flash.
    """

    def __init__(self):
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.agents = {
            "finance": self.finance_agent,
            "legal": self.legal_agent,
            "esg": self.esg_agent
        }

    async def delegate(self, task: str, supplier_id: int = None) -> Dict:
        """Determine which agent should handle a task."""
        task_lower = task.lower()
        if "finance" in task_lower:
            return await self.finance_agent(supplier_id)
        elif "legal" in task_lower:
            return await self.legal_agent(supplier_id)
        elif "esg" in task_lower:
            return await self.esg_agent(supplier_id)
        else:
            return {"status": "unknown_task", "task": task}

    async def finance_agent(self, supplier_id: int):
        prompt = f"Analyze financial stability and cash flow risk for supplier {supplier_id}."
        response = self.model.generate_content(prompt)
        return {"agent": "finance", "analysis": response.text}

    async def legal_agent(self, supplier_id: int):
        prompt = f"Summarize legal exposure and potential compliance issues for supplier {supplier_id}."
        response = self.model.generate_content(prompt)
        return {"agent": "legal", "analysis": response.text}

    async def esg_agent(self, supplier_id: int):
        prompt = f"Assess ESG (Environmental, Social, Governance) standing for supplier {supplier_id}."
        response = self.model.generate_content(prompt)
        return {"agent": "esg", "analysis": response.text}
