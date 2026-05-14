from abc import ABC, abstractmethod

from schemas.filter import FilterCondition


class LLMProvider(ABC):
    @abstractmethod
    async def parse_filter(self, text: str) -> FilterCondition:
        """Parse natural language filter text into a structured condition."""


class RealLLMProvider(LLMProvider):
    async def parse_filter(self, text: str) -> FilterCondition:
        # TODO: Replace with real LLM API call and strict JSON parsing.
        raise NotImplementedError("Real LLM API is not configured yet.")
