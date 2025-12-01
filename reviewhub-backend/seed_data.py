# see_data.py
"""
Seed data script for ReviewHub database (safe + idempotent).

- Uses app_enhanced.py (current backend entrypoint)
- DOES NOT call db.drop_all() (safe for shared / production DBs)
- Can be run multiple times without duplicating records
- Creates:
    - Categories (Electronics, Automotive, Home & Garden, Beauty & Health)
    - Products under those categories
    - Sample users
    - Sample reviews and review votes
"""

from datetime import datetime
import os

from dotenv import load_dotenv

# IMPORTANT: this now uses app_enhanced, not app
from app_enhanced import app, db, User, Category, Product, Review, ReviewVote

load_dotenv()


# ---------- Helper functions ----------

def get_or_create_user(username, email, first_name, last_name, password, is_admin=False):
    """Get an existing user by email, or create a new one."""
    user = User.query.filter_by(email=email).first()
    if user:
        return user

    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        email_verified=True,
        is_admin=is_admin,
        created_at=datetime.utcnow(),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def get_or_create_category(name, slug, description="", icon_url=None):
    """Get an existing category by slug, or create a new one."""
    category = Category.query.filter_by(slug=slug).first()
    if category:
        return category

    category = Category(
        name=name,
        slug=slug,
        description=description,
        icon_url=icon_url,
        created_at=datetime.utcnow(),
    )
    db.session.add(category)
    db.session.commit()
    return category


def get_or_create_product(
    name,
    brand,
    description,
    image_url,
    price_min,
    price_max,
    specifications,
    category,
):
    """
    Get or create a product by (name, brand).

    Category is passed as a Category object.
    """
    product = Product.query.filter_by(name=name, brand=brand).first()
    if product:
        return product

    product = Product(
        name=name,
        brand=brand,
        model=specifications.get("model") if isinstance(specifications, dict) else None,
        description=description,
        image_url=image_url,
        price_min=price_min,
        price_max=price_max,
        specifications=specifications,
        category_id=category.id,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.session.add(product)
    db.session.commit()
    return product


def get_or_create_review(user, product, rating, title, content, verified_purchase):
    """
    Get or create a review keyed by (user, product, title).

    NOTE: Review model field is `verified_purchase`, not `is_verified_purchase`.
    """
    existing = Review.query.filter_by(
        user_id=user.id,
        product_id=product.id,
        title=title,
    ).first()
    if existing:
        return existing

    review = Review(
        user_id=user.id,
        product_id=product.id,
        rating=rating,
        title=title,
        content=content,
        pros=None,
        cons=None,
        verified_purchase=verified_purchase,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        is_active=True,
    )
    db.session.add(review)
    db.session.commit()
    return review


def ensure_review_votes(reviews, users):
    """
    Create some simple "helpful" votes for reviews, without duplicates.
    Does nothing if votes already exist for that user+review pair.
    """
    for review in reviews:
        for user in users:
            if user.id == review.user_id:
                continue  # author doesn't vote on own review

            existing_vote = ReviewVote.query.filter_by(
                user_id=user.id,
                review_id=review.id,
            ).first()
            if existing_vote:
                continue

            # Basic pattern: first two non-author users upvote each review
            # (no need for randomness to keep it deterministic)
            helpful = user.id % 2 == 0  # some True, some False based on user id parity

            vote = ReviewVote(
                user_id=user.id,
                review_id=review.id,
                is_helpful=helpful,
                created_at=datetime.utcnow(),
            )
            db.session.add(vote)

    db.session.commit()


# ---------- Main seeding logic ----------

def create_seed_data():
    """Create / update initial seed data without dropping tables."""
    with app.app_context():
        print("=== ReviewHub seed: starting ===")
        print(f"Using DB URI: {os.getenv('SQLALCHEMY_DATABASE_URI') or os.getenv('DATABASE_URL')}")

        # Ensure tables exist (safe for local dev; migrations handle prod)
        db.create_all()

        # 1. Categories
        print("Seeding categories...")

        electronics = get_or_create_category(
            name="Electronics",
            slug="electronics",
            description="Smartphones, laptops, headphones, and other electronic devices",
            icon_url="/assets/category_electronics.png",
        )
        automotive = get_or_create_category(
            name="Automotive",
            slug="automotive",
            description="Cars, motorcycles, and automotive accessories",
            icon_url="/assets/category_automotive.png",
        )
        home_garden = get_or_create_category(
            name="Home & Garden",
            slug="home-garden",
            description="Home appliances, furniture, and garden tools",
            icon_url="/assets/category_home.png",
        )
        beauty_health = get_or_create_category(
            name="Beauty & Health",
            slug="beauty-health",
            description="Cosmetics, skincare, and health products",
            icon_url="/assets/category_beauty.png",
        )

        categories = [electronics, automotive, home_garden, beauty_health]

        # 2. Products
        print("Seeding products...")

        products_data = [
            # Electronics
            {
                "name": "iPhone 15 Pro",
                "brand": "Apple",
                "description": (
                    "The iPhone 15 Pro features a titanium design, advanced camera system, "
                    "and the powerful A17 Pro chip for exceptional performance."
                ),
                "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
                "price_min": 999,
                "price_max": 1199,
                "specifications": {
                    "display": "6.1-inch Super Retina XDR",
                    "storage": "128GB, 256GB, 512GB, 1TB",
                    "camera": "48MP Main, 12MP Ultra Wide, 12MP Telephoto",
                    "chip": "A17 Pro",
                    "material": "Titanium",
                },
                "category": electronics,
            },
            {
                "name": "Samsung Galaxy S24",
                "brand": "Samsung",
                "description": "Flagship Android phone with AI features and exceptional camera capabilities.",
                "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
                "price_min": 799,
                "price_max": 999,
                "specifications": {
                    "display": "6.2-inch Dynamic AMOLED 2X",
                    "storage": "128GB, 256GB, 512GB",
                    "camera": "50MP Main, 12MP Ultra Wide, 10MP Telephoto",
                    "chip": "Snapdragon 8 Gen 3",
                    "features": "Galaxy AI, S Pen support",
                },
                "category": electronics,
            },
            {
                "name": "MacBook Pro 14-inch",
                "brand": "Apple",
                "description": (
                    "Professional laptop with M3 chip, stunning Liquid Retina XDR display, "
                    "and all-day battery life."
                ),
                "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
                "price_min": 1599,
                "price_max": 2499,
                "specifications": {
                    "display": "14.2-inch Liquid Retina XDR",
                    "chip": "Apple M3, M3 Pro, M3 Max",
                    "memory": "8GB, 16GB, 32GB unified memory",
                    "storage": "512GB, 1TB, 2TB, 4TB SSD",
                    "battery": "Up to 22 hours",
                },
                "category": electronics,
            },
            {
                "name": "Sony WH-1000XM5",
                "brand": "Sony",
                "description": "Industry-leading noise canceling headphones with exceptional sound quality.",
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
                "price_min": 299,
                "price_max": 399,
                "specifications": {
                    "type": "Over-ear wireless headphones",
                    "noise_canceling": "Industry-leading ANC",
                    "battery": "Up to 30 hours",
                    "connectivity": "Bluetooth 5.2, NFC",
                    "features": "Touch controls, voice assistant",
                },
                "category": electronics,
            },
            # Automotive
            {
                "name": "Toyota RAV4",
                "brand": "Toyota",
                "description": "Reliable compact SUV with excellent fuel economy and advanced safety features.",
                "image_url": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
                "price_min": 28000,
                "price_max": 38000,
                "specifications": {
                    "type": "Compact SUV",
                    "engine": "2.5L 4-cylinder",
                    "fuel_economy": "28 city / 35 highway mpg",
                    "drivetrain": "FWD, AWD available",
                    "safety": "Toyota Safety Sense 2.0",
                },
                "category": automotive,
            },
            {
                "name": "Tesla Model 3",
                "brand": "Tesla",
                "description": "Electric sedan with autopilot capabilities and impressive range.",
                "image_url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400",
                "price_min": 35000,
                "price_max": 55000,
                "specifications": {
                    "type": "Electric sedan",
                    "range": "Up to 358 miles",
                    "acceleration": "0-60 mph in 3.1s (Performance)",
                    "charging": "Supercharger network",
                    "features": "Autopilot, over-the-air updates",
                },
                "category": automotive,
            },
            # Home & Garden
            {
                "name": "Dyson V15 Detect",
                "brand": "Dyson",
                "description": "Powerful cordless vacuum with laser dust detection and advanced filtration.",
                "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
                "price_min": 649,
                "price_max": 749,
                "specifications": {
                    "type": "Cordless stick vacuum",
                    "runtime": "Up to 60 minutes",
                    "filtration": "Advanced whole-machine filtration",
                    "features": "Laser dust detection, LCD screen",
                    "attachments": "Multiple cleaning tools included",
                },
                "category": home_garden,
            },
            {
                "name": "KitchenAid Stand Mixer",
                "brand": "KitchenAid",
                "description": "Professional-grade stand mixer for all your baking and cooking needs.",
                "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
                "price_min": 299,
                "price_max": 499,
                "specifications": {
                    "capacity": "5-quart stainless steel bowl",
                    "power": "325-watt motor",
                    "speeds": "10 speeds",
                    "attachments": "Dough hook, flat beater, wire whip",
                    "colors": "Multiple color options available",
                },
                "category": home_garden,
            },
            # Beauty & Health
            {
                "name": "Olaplex Hair Perfector No. 3",
                "brand": "Olaplex",
                "description": "At-home hair treatment that repairs and strengthens damaged hair.",
                "image_url": "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400",
                "price_min": 28,
                "price_max": 28,
                "specifications": {
                    "type": "Hair treatment",
                    "size": "3.3 fl oz / 100 ml",
                    "usage": "Weekly treatment",
                    "benefits": "Repairs, strengthens, protects",
                    "suitable_for": "All hair types",
                },
                "category": beauty_health,
            },
            {
                "name": "Fitbit Charge 5",
                "brand": "Fitbit",
                "description": "Advanced fitness tracker with built-in GPS and health monitoring features.",
                "image_url": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400",
                "price_min": 149,
                "price_max": 199,
                "specifications": {
                    "display": "Color AMOLED display",
                    "battery": "Up to 7 days",
                    "features": "Built-in GPS, heart rate monitoring",
                    "health": "Stress management, sleep tracking",
                    "compatibility": "iOS and Android",
                },
                "category": beauty_health,
            },
        ]

        product_objects = []
        for pdata in products_data:
            product = get_or_create_product(
                name=pdata["name"],
                brand=pdata["brand"],
                description=pdata["description"],
                image_url=pdata["image_url"],
                price_min=pdata["price_min"],
                price_max=pdata["price_max"],
                specifications=pdata["specifications"],
                category=pdata["category"],
            )
            product_objects.append(product)

        # 3. Users
        print("Seeding users...")

        users_data = [
            {
                "username": "john_doe",
                "email": "john@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "password": "password123",
            },
            {
                "username": "jane_smith",
                "email": "jane@example.com",
                "first_name": "Jane",
                "last_name": "Smith",
                "password": "password123",
            },
            {
                "username": "mike_wilson",
                "email": "mike@example.com",
                "first_name": "Mike",
                "last_name": "Wilson",
                "password": "password123",
            },
            {
                "username": "sarah_johnson",
                "email": "sarah@example.com",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "password": "password123",
            },
            {
                "username": "alex_brown",
                "email": "alex@example.com",
                "first_name": "Alex",
                "last_name": "Brown",
                "password": "password123",
            },
        ]

        user_objects = []
        for u in users_data:
            user = get_or_create_user(
                username=u["username"],
                email=u["email"],
                first_name=u["first_name"],
                last_name=u["last_name"],
                password=u["password"],
                is_admin=(u["username"] == "john_doe"),  # make one admin
            )
            user_objects.append(user)

        # 4. Reviews
        print("Seeding reviews...")

        # Map helpers for readability
        products_by_name = {p.name: p for p in product_objects}
        users_by_email = {u.email: u for u in user_objects}

        sample_reviews = [
            # iPhone 15 Pro reviews
            {
                "user_email": "john@example.com",
                "product_name": "iPhone 15 Pro",
                "rating": 5,
                "title": "Amazing phone with incredible camera",
                "content": (
                    "The iPhone 15 Pro exceeded my expectations. The camera quality is outstanding, "
                    "especially in low light conditions. The titanium build feels premium and the "
                    "A17 Pro chip handles everything I throw at it effortlessly."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "jane@example.com",
                "product_name": "iPhone 15 Pro",
                "rating": 4,
                "title": "Great phone but expensive",
                "content": (
                    "Love the new features and the build quality is excellent. However, the price point "
                    "is quite high. The battery life could be better for heavy users."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "mike@example.com",
                "product_name": "iPhone 15 Pro",
                "rating": 5,
                "title": "Best iPhone yet",
                "content": (
                    "Upgraded from iPhone 12 and the difference is night and day. The Action Button is "
                    "incredibly useful and the camera improvements are significant."
                ),
                "verified_purchase": False,
            },
            # Samsung Galaxy S24 reviews
            {
                "user_email": "sarah@example.com",
                "product_name": "Samsung Galaxy S24",
                "rating": 4,
                "title": "Solid Android flagship",
                "content": (
                    "The Galaxy S24 is a well-rounded phone with excellent display and camera. "
                    "The AI features are interesting but still need some refinement."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "alex@example.com",
                "product_name": "Samsung Galaxy S24",
                "rating": 5,
                "title": "Love the AI features",
                "content": (
                    "The Galaxy AI features are game-changing. Photo editing is so much easier now, "
                    "and the translation features work surprisingly well."
                ),
                "verified_purchase": True,
            },
            # MacBook Pro reviews
            {
                "user_email": "john@example.com",
                "product_name": "MacBook Pro 14-inch",
                "rating": 5,
                "title": "Perfect for professional work",
                "content": (
                    "As a video editor, this MacBook Pro handles 4K editing like a breeze. "
                    "The M3 chip is incredibly powerful and the battery life is impressive."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "mike@example.com",
                "product_name": "MacBook Pro 14-inch",
                "rating": 4,
                "title": "Great laptop, steep price",
                "content": (
                    "Excellent build quality and performance, but the price is quite high especially "
                    "with upgrades. The display is gorgeous though."
                ),
                "verified_purchase": False,
            },
            # Sony headphones reviews
            {
                "user_email": "jane@example.com",
                "product_name": "Sony WH-1000XM5",
                "rating": 5,
                "title": "Best noise canceling headphones",
                "content": (
                    "These headphones are incredible for travel and work. The noise canceling is "
                    "industry-leading and the sound quality is exceptional."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "sarah@example.com",
                "product_name": "Sony WH-1000XM5",
                "rating": 4,
                "title": "Great sound, comfortable fit",
                "content": (
                    "Very comfortable for long listening sessions. Sound quality is excellent and the "
                    "touch controls work well once you get used to them."
                ),
                "verified_purchase": True,
            },
            # Toyota RAV4 reviews
            {
                "user_email": "alex@example.com",
                "product_name": "Toyota RAV4",
                "rating": 4,
                "title": "Reliable family SUV",
                "content": (
                    "Perfect family car with great fuel economy and safety features. "
                    "Interior could be more premium for the price point."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "john@example.com",
                "product_name": "Toyota RAV4",
                "rating": 5,
                "title": "Outstanding reliability",
                "content": (
                    "Had this car for 2 years now and zero issues. Great in all weather conditions "
                    "and the resale value is excellent."
                ),
                "verified_purchase": True,
            },
            # Tesla Model 3 reviews
            {
                "user_email": "jane@example.com",
                "product_name": "Tesla Model 3",
                "rating": 5,
                "title": "Future of driving",
                "content": (
                    "The driving experience is unlike anything else. Autopilot works great on highways "
                    "and the over-the-air updates keep improving the car."
                ),
                "verified_purchase": True,
            },
            {
                "user_email": "mike@example.com",
                "product_name": "Tesla Model 3",
                "rating": 3,
                "title": "Good car, charging concerns",
                "content": (
                    "Love the performance and tech features, but charging infrastructure is still a concern "
                    "for long trips. Build quality has some issues."
                ),
                "verified_purchase": False,
            },
        ]

        review_objects = []
        for r in sample_reviews:
            user = users_by_email.get(r["user_email"])
            product = products_by_name.get(r["product_name"])
            if not user or not product:
                continue

            review = get_or_create_review(
                user=user,
                product=product,
                rating=r["rating"],
                title=r["title"],
                content=r["content"],
                verified_purchase=r["verified_purchase"],
            )
            review_objects.append(review)

        # 5. Votes
        print("Seeding review votes...")
        ensure_review_votes(review_objects, user_objects)

        # Final counts
        total_categories = Category.query.count()
        total_products = Product.query.count()
        total_users = User.query.count()
        total_reviews = Review.query.count()
        total_votes = ReviewVote.query.count()

        print("=== ReviewHub seed: complete ===")
        print(f"Categories: {total_categories}")
        print(f"Products:   {total_products}")
        print(f"Users:      {total_users}")
        print(f"Reviews:    {total_reviews}")
        print(f"Votes:      {total_votes}")
        print("\nSample login credentials:")
        print("  Username: john_doe  | Email: john@example.com  | Password: password123")
        print("  Username: jane_smith| Email: jane@example.com  | Password: password123")
        print("  Username: mike_wilson| Email: mike@example.com | Password: password123")


if __name__ == "__main__":
    create_seed_data()
