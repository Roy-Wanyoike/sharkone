'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sw', label: 'Swahili', flag: '🇰🇪' },
] as const;

type Locale = (typeof languages)[number]['code'];

export function LanguageSwitcher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  useEffect(() => {
    // Check query param first, then localStorage
    const langParam = searchParams.get('lang');
    const stored = localStorage.getItem('sharkone-locale') as Locale | null;
    const locale: Locale = (langParam as Locale) ?? stored ?? 'en';
    setCurrentLocale(locale);
  }, [searchParams]);

  const handleSwitch = (locale: Locale) => {
    localStorage.setItem('sharkone-locale', locale);
    const params = new URLSearchParams(searchParams.toString());
    if (locale === 'en') {
      params.delete('lang');
    } else {
      params.set('lang', locale);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  };

  const current = languages.find((l) => l.code === currentLocale) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
        >
          <span className="text-sm">{current.flag}</span>
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleSwitch(lang.code)}
            className={`flex items-center gap-2 cursor-pointer text-sm ${
              currentLocale === lang.code ? 'bg-amber-50 text-amber-700' : ''
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
