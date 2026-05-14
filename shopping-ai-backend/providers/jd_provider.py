from abc import ABC, abstractmethod

from schemas.product import ProductCard, SearchRequest


class JDProvider(ABC):
    @abstractmethod
    async def search_products(self, query: SearchRequest) -> list[ProductCard]:
        """Search JD Union products and normalize response."""


class RealJDProvider(JDProvider):
    async def search_products(self, query: SearchRequest) -> list[ProductCard]:
        # TODO: Replace with real JD Union API auth, signing, search, and affiliate link generation.
        raise NotImplementedError("Real JD Union API is not configured yet.")
