from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from models.product import PriceHistory, Product


def record_initial_price_history(db: Session, product: Product) -> None:
    now = datetime.now(timezone.utc)
    offsets = [
        (now - timedelta(days=18), Decimal("1.05")),
        (now - timedelta(days=11), Decimal("1.02")),
        (now - timedelta(days=5), Decimal("0.98")),
        (now, Decimal("1.00")),
    ]
    for recorded_at, factor in offsets:
        db.add(
            PriceHistory(
                product_id=product.id,
                platform=product.platform,
                external_product_id=product.external_product_id,
                price=(product.price * factor).quantize(Decimal("0.01")),
                currency="CNY",
                recorded_at=recorded_at,
            )
        )


def get_price_history(db: Session, product_id: int) -> list[PriceHistory]:
    return (
        db.query(PriceHistory)
        .filter(PriceHistory.product_id == product_id)
        .order_by(PriceHistory.recorded_at.asc())
        .all()
    )
