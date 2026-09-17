// Maps the day values used by the robots (Gen4: "mon".."sun",
// Gen3: enum names "MONDAY".."SUNDAY") to the keys in locales/*.json (days.*).
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

const DAY_ALIASES: Record<string, DayKey> = {
    mon: 'monday', monday: 'monday',
    tue: 'tuesday', tuesday: 'tuesday',
    wed: 'wednesday', wednesday: 'wednesday',
    thu: 'thursday', thursday: 'thursday',
    fri: 'friday', friday: 'friday',
    sat: 'saturday', saturday: 'saturday',
    sun: 'sunday', sunday: 'sunday',
}

export function dayKey(value: string): DayKey {
    return DAY_ALIASES[value.toLowerCase()] ?? 'monday'
}
