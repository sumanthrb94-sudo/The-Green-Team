import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({
  onDark = false,
  iconOnly = false,
  className,
}: {
  onDark?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" aria-label="The Green Team — Home" className={cn('flex items-center gap-3 group', className)}>
      <Image
        src={onDark ? '/logo-mark-dark.svg' : '/logo-mark.svg'}
        alt=""
        width={40}
        height={40}
        className="w-10 h-10 transition-transform duration-500 group-hover:rotate-[-6deg]"
        priority
      />
      {!iconOnly && (
        <span className="leading-none">
          <span
            className={cn(
              'block font-headline font-extrabold tracking-[0.18em] text-[15px]',
              onDark ? 'text-white' : 'text-[#2c4a2e]'
            )}
          >
            THE GREEN TEAM
          </span>
          <span
            className={cn(
              'block text-[8px] uppercase tracking-[0.5em] font-bold mt-1',
              onDark ? 'text-white/50' : 'text-secondary/60'
            )}
          >
            Channel Partners · Hyderabad
          </span>
        </span>
      )}
    </Link>
  );
}
