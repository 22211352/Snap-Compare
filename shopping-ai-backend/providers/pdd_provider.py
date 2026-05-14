from abc import ABC, abstractmethod

from schemas.product import ProductCard, SearchRequest


class PDDProvider(ABC):
    @abstractmethod
    async def search_products(self, query: SearchRequest) -> list[ProductCard]:
        """Search PDD DuoDuoJinBao products and normalize response."""


class RealPDDProvider(PDDProvider):
    async def search_products(self, query: SearchRequest) -> list[ProductCard]:
        # TODO: Replace with real PDD DuoDuoJinBao API auth, signing, search, and promotion link generation.
        raise NotImplementedError("Real PDD API is not configured yet.")
