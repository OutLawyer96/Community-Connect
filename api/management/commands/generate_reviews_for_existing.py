import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, Provider, Review


POSITIVE_COMMENTS = [
    "Excellent service! Highly recommended.",
    "Very professional and timely work.",
    "Great experience, will hire again.",
    "Quality work at a fair price.",
    "Friendly and knowledgeable staff."
]

NEUTRAL_COMMENTS = [
    "Service was okay, nothing exceptional.",
    "Average experience, could be better.",
    "Work was completed as expected.",
    "Decent service for the price.",
]

NEGATIVE_COMMENTS = [
    "Not satisfied with the service.",
    "Had issues that were not fully resolved.",
    "Would not recommend based on my experience.",
]


class Command(BaseCommand):
    help = "Clean orphaned reviews and generate reviews for existing providers from existing customers"

    def add_arguments(self, parser):
        parser.add_argument(
            "--per-provider",
            type=int,
            default=3,
            help="Target number of reviews to create per provider if they have fewer than this"
        )
        parser.add_argument(
            "--max",
            type=int,
            default=5,
            help="Maximum reviews to create per provider in this run"
        )

    def handle(self, *args, **options):
        per_provider = max(0, options["per_provider"]) or 0
        max_per_provider = max(per_provider, options["max"]) if options.get("max") else per_provider

        # 1) Remove orphaned reviews (where provider_id no longer exists)
        existing_provider_ids = set(Provider.objects.values_list("id", flat=True))
        orphan_qs = Review.objects.exclude(provider_id__in=existing_provider_ids)
        orphan_count = orphan_qs.count()
        if orphan_count:
            # Delete in chunks to avoid long-running transactions on SQLite
            BATCH = 1000
            ids = list(orphan_qs.values_list('id', flat=True))
            for i in range(0, len(ids), BATCH):
                Review.objects.filter(id__in=ids[i:i+BATCH]).delete()
        self.stdout.write(self.style.WARNING(f"Deleted {orphan_count} orphaned reviews."))

        customers = list(User.objects.filter(role='customer').values_list('id', flat=True))
        if not customers:
            self.stdout.write(self.style.ERROR("No customers found. Cannot generate reviews."))
            return

        providers = list(Provider.objects.filter(is_active=True).values_list('id', flat=True))
        if not providers:
            self.stdout.write(self.style.ERROR("No active providers found. Nothing to do."))
            return

        created = 0
        to_create = []
        now = timezone.now()

        for pid in providers:
            current_count = Review.objects.filter(provider_id=pid).count()
            target = min(max(per_provider - current_count, 0), max_per_provider)
            if target <= 0:
                continue

            # Pick distinct customers that have not reviewed this provider
            random.shuffle(customers)
            picked = 0
            for uid in customers:
                if picked >= target:
                    break
                if not Review.objects.filter(user_id=uid, provider_id=pid).exists():
                    # Weighted rating distribution
                    rating = random.choices([1, 2, 3, 4, 5], weights=[5, 10, 20, 35, 30])[0]
                    if rating >= 4:
                        comment = random.choice(POSITIVE_COMMENTS)
                    elif rating == 3:
                        comment = random.choice(NEUTRAL_COMMENTS)
                    else:
                        comment = random.choice(NEGATIVE_COMMENTS)

                    to_create.append(Review(
                        user_id=uid,
                        provider_id=pid,
                        rating=rating,
                        comment=comment,
                        is_verified=random.choice([True, False]),
                        created_at=now
                    ))
                    picked += 1

        if to_create:
            # Try bulk create; if it fails due to FK/unique, fall back to row-by-row insertion
            try:
                Review.objects.bulk_create(to_create, batch_size=500, ignore_conflicts=True)
                created = len(to_create)
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Bulk create failed ({e}); falling back to per-row insert."))
                created = 0
                for r in to_create:
                    try:
                        # Skip if duplicate exists
                        if not Review.objects.filter(user_id=r.user_id, provider_id=r.provider_id).exists():
                            r.pk = None
                            r.save()
                            created += 1
                    except Exception:
                        continue

        total_reviews = Review.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Created {created} new reviews. Total reviews now: {total_reviews}."
        ))
