export type Size = '100' | '75' | '50';
export type Align = 'left' | 'center' | 'right';

export type InsertEvent = {
    url: string;
    alt: string;
    size: Size;
    align: Align;
};