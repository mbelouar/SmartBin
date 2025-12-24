"""
Management command to sync current_capacity_used with fill_level for all bins
Usage: python manage.py sync_capacity
"""
from django.core.management.base import BaseCommand
from decimal import Decimal
from bins.models import Bin


class Command(BaseCommand):
    help = 'Sync current_capacity_used with fill_level for all bins'

    def handle(self, *args, **options):
        bins = Bin.objects.all()
        updated_count = 0
        
        self.stdout.write(self.style.WARNING(f'\nSyncing capacity for {bins.count()} bins...'))
        self.stdout.write('-' * 80)
        
        for bin_instance in bins:
            # Calculate expected current_capacity_used from fill_level
            expected_capacity_used = Decimal(str(bin_instance.capacity)) * Decimal(str(bin_instance.fill_level)) / Decimal('100')
            
            # Check if it needs updating
            if bin_instance.current_capacity_used is None or abs(bin_instance.current_capacity_used - expected_capacity_used) > Decimal('0.01'):
                old_value = bin_instance.current_capacity_used
                bin_instance.current_capacity_used = expected_capacity_used
                bin_instance.save(update_fields=['current_capacity_used', 'updated_at'])
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ {bin_instance.name}: {old_value}L → {expected_capacity_used}L '
                        f'(Fill: {bin_instance.fill_level}%, Capacity: {bin_instance.capacity}L)'
                    )
                )
                updated_count += 1
            else:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓  {bin_instance.name}: Already synced at {bin_instance.current_capacity_used}L '
                        f'(Fill: {bin_instance.fill_level}%)'
                    )
                )
        
        self.stdout.write('-' * 80)
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Sync complete! Updated {updated_count} bin(s), {bins.count() - updated_count} already synced.\n'
            )
        )
