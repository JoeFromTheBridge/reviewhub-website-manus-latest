"""
Safe seed script for ReviewHub (Render-compatible)
Populates categories, products, users, and reviews WITHOUT dropping tables.
Can be run repeatedly with no duplicates.
"""

import os
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv

# Load .env BEFORE importing the app so DATABASE_URL is used
load_dotenv()

from app_enhanced import app, db, User, Category, Product, Review, ReviewVote


def log_header():
    print("\n=== ReviewHub Seeder ===")
    db_uri = os.getenv("DATABASE_URL") or app.config.get("SQLALCHEMY_DATABASE_URI")
    print(f"Using database:\n  {db_uri}\n")


def get_or_create(model, defaults=None, **kwargs):
    """Fetch an object or create it safely without duplicates."""
    instance = model.query.filter_by(**kwargs).first()
    if instance:
        return instance, False
    params = dict(kwargs)
    if defaults:
        params.update(defaults)
    instance = model(**params)
    db.session.add(instance)
    return instance, True


def seed_categories():
    print("Seeding categories...")

    categories = [
        {
            'name': 'Electronics',
            'slug': 'electronics',
            'description': 'Smartphones, laptops, headphones, and other electronic devices',
            'icon_url': '/assets/category_electronics.png'
        },
        {
            'name': 'Automotive',
            'slug': 'automotive',
            'description': 'Cars, motorcycles, and automotive accessories',
            'icon_url': '/assets/category_automotive.png'
        },
        {
            'name': 'Home & Garden',
            'slug': 'home-garden',
            'description': 'Home appliances, furniture, and garden tools',
            'icon_url': '/assets/category_home.png'
        },
        {
            'name': 'Beauty & Health',
            'slug': 'beauty-health',
            'description': 'Cosmetics, skincare, and health products',
            'icon_url': '/assets/category_beauty.png'
        }
    ]

    created_count = 0
    for cat in categories:
        _, created = get_or_create(Category, **cat)
        if created:
            created_count += 1

    db.session.commit()
    print(f"Categories added: {created_count}")


def seed_products():
    print("Seeding products...")

    products = [
        # Electronics
        {
            'name': 'iPhone 15 Pro',
            'brand': 'Apple',
            'description': 'Titanium design, advanced camera system, and A17 Pro chip.',
            'image_url': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
            'price_min': 999,
            'price_max': 1199,
            'specifications': {
                'display': '6.1-inch Super Retina XDR',
                'storage': '128GB–1TB',
                'camera': '48MP Main',
                'chip': 'A17 Pro'
            },
            'category_slug': 'electronics'
        },
        {
            'name': 'Samsung Galaxy S24',
            'brand': 'Samsung',
            'description': 'Android flagship with AI-powered features.',
            'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
            'price_min': 799,
            'price_max': 999,
            'specifications': {
                'display': '6.2-inch AMOLED',
                'camera': '50MP Main',
                'chip': 'Snapdragon 8 Gen 3'
            },
            'category_slug': 'electronics'
        },
        {
            'name': 'Dyson V15 Detect',
            'brand': 'Dyson',
            'description': 'Cordless vacuum with laser dust detection.',
            'image_url': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
            'price_min': 649,
            'price_max': 749,
            'specifications': {
                'type': 'Cordless vacuum',
                'runtime': '60 minutes'
            },
            'category_slug': 'home-garden'
        },
    ]

    created_count = 0
    for p in products:
        category = Category.query.filter_by(slug=p["category_slug"]).first()
        if not category:
            continue

        defaults = {
            "brand": p["brand"],
            "description": p["description"],
            "image_url": p["image_url"],
            "price_min": p["price_min"],
            "price_max": p["price_max"],
            "specifications": p["specifications"],
            "category_id": category.id,
        }

        _, created = get_or_create(Product, defaults=defaults, name=p["name"])
        if created:
            created_count += 1

    db.session.commit()
    print(f"Products added: {created_count}")


def seed_users():
    print("Seeding users...")

    users = [
        ('john_doe', 'john@example.com'),
        ('jane_smith', 'jane@example.com'),
        ('alex_brown', 'alex@example.com'),
    ]

    created_count = 0
    for username, email in users:
        defaults = {
            "first_name": username.split('_')[0].title(),
            "last_name": username.split('_')[1].title() if '_' in username else '',
            "email": email,
        }
        user, created = get_or_create(User, defaults=defaults, username=username)
        if created:
            user.set_password("password123")
            created_count += 1

    db.session.commit()
    print(f"Users added: {created_count}")


def seed_reviews():
    print("Seeding reviews...")

    sample_text = [
        "Great quality and performance.",
        "Exceeded expectations!",
        "Decent product, but pricey.",
        "Would definitely recommend.",
        "Solid choice for everyday use."
    ]

    created_count = 0

    users = User.query.all()
    products = Product.query.all()

    if not users or not products:
        print("Skipping review seeding — no users/products found.")
        return

    for product in products:
        for _ in range(random.randint(1, 3)):
            user = random.choice(users)
            rating = random.randint(3, 5)

            defaults = {
                "user_id": user.id,
                "product_id": product.id,
                "rating": rating,
                "title": f"{rating}-star review",
                "content": random.choice(sample_text),
                "verified_purchase": random.choice([True, False]),
            }

            # Prevent duplicate user/product review
            existing = Review.query.filter_by(user_id=user.id, product_id=product.id).first()
            if existing:
                continue

            review = Review(**defaults)
            db.session.add(review)
            created_count += 1

    db.session.commit()
    print(f"Reviews added: {created_count}")


def run():
    log_header()

    with app.app_context():
        seed_categories()
        seed_products()
        seed_users()
        seed_reviews()

        print("\nSeeding complete.\n")


if __name__ == "__main__":
    run()

