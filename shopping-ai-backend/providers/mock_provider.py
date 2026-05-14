from decimal import Decimal
import re

from providers.jd_provider import JDProvider
from providers.llm_provider import LLMProvider
from providers.pdd_provider import PDDProvider
from providers.vision_provider import VisionProvider
from schemas.filter import FilterCondition
from schemas.product import ProductCard, SearchRequest
from schemas.recognize import RecognizedItemSchema


PRODUCT_IMAGE = "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=900&auto=format&fit=crop&q=80"
FROZEN_DESCRIPTION = (
    "和芯星通NAV3120SAA GNSS定位模块，采用紧凑型设计，表面为银色金属封装，"
    "背面带有PCB金手指触点，适用于各类需要高精度卫星导航和定位功能的嵌入式应用。"
)
FROZEN_KEYWORDS = ["和芯星通", "NAV3120SAA", "GNSS定位模块", "卫星导航", "定位模块", "嵌入式模块"]


class MockProvider(VisionProvider, JDProvider, PDDProvider, LLMProvider):
    async def recognize(self, image_url: str) -> RecognizedItemSchema:
        print("[Vision] Mock frozen Gemini result used. Gemini API not called.")
        return RecognizedItemSchema(
            category="GNSS定位模块",
            brand="和芯星通",
            color="银色",
            style=FROZEN_DESCRIPTION,
            material="金属封装/PCB触点",
            keywords=FROZEN_KEYWORDS,
            confidence=0.95,
            raw_result={
                "provider": "mock",
                "image_url": image_url,
                "description": FROZEN_DESCRIPTION,
                "frozen_from": "gemini",
            },
            provider="mock",
            is_mock=True,
            fallback_reason="Frozen Gemini result for local testing",
            raw_model_output=None,
        )

    async def search_products(self, query: SearchRequest) -> list[ProductCard]:
        is_pdd = self.__class__.__name__.lower().startswith("mockpdd")
        platform = "pdd" if is_pdd else "jd"
        names = [
            ("和芯星通 NAV3120SAA GNSS定位模块 高精度卫星导航模块", 168, 199, "模块官方旗舰店", "official", 3600),
            ("NAV3120SAA 北斗GPS双模定位模块 嵌入式导航板卡", 152, 189, "电子元器件授权店", "authorized", 2800),
            ("GNSS定位模块 卫星导航接收模块 车载无人机嵌入式模块", 139, 169, "百亿补贴店", "normal", 5200),
            ("和芯星通兼容定位模块 金手指封装 高精度导航模组", 176, 218, "工业电子旗舰店", "official", 1900),
        ]
        products: list[ProductCard] = []
        for index, (title, price, original, shop_name, shop_type, sales) in enumerate(names, start=1):
            adjusted = price - 8 if platform == "pdd" and index in (1, 3) else price
            products.append(
                ProductCard(
                    platform=platform,
                    external_product_id=f"{platform}-gnss-{index}",
                    title=title,
                    image_url=PRODUCT_IMAGE,
                    price=Decimal(str(adjusted)),
                    original_price=Decimal(str(original)),
                    shop_name=shop_name,
                    shop_type=shop_type,
                    sales_count=sales,
                    coupon_info="满150减10" if index in (1, 2) else "限时补贴",
                    product_url=f"https://example.com/{platform}/product/gnss-{index}",
                    attributes={"brand": "和芯星通", "model": "NAV3120SAA", "category": "GNSS定位模块", "source_query": query.keywords[:3]},
                    score=Decimal(str(0.97 - index * 0.04)),
                    recommend_reason="型号和识别结果高度匹配，适合优先比价" if index == 1 else "与GNSS定位模块关键词匹配度高",
                )
            )
        return products

    async def parse_filter(self, text: str) -> FilterCondition:
        condition = FilterCondition()
        normalized = text.lower()
        match = re.search(r"(\d+(?:\.\d+)?)\s*(?:元)?(?:以内|以下|之内|内)?", normalized)
        if "预算" in text or "以内" in text or "以下" in text:
            if match:
                condition.max_price = float(match.group(1))
        if "旗舰" in text or "官方" in text:
            condition.shop_type = "official"
        if "京东" in text or "jd" in normalized:
            condition.platforms.append("jd")
        if "拼多多" in text or "pdd" in normalized:
            condition.platforms.append("pdd")
        if "便宜" in text or "低价" in text or "价格低" in text:
            condition.sort_by = "price_asc"
        if "销量" in text:
            condition.sort_by = "sales_desc"
        return condition


class MockJDProvider(MockProvider):
    pass


class MockPDDProvider(MockProvider):
    pass
