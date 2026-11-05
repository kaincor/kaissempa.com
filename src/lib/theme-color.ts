/**
 * Who gets a status-bar colour: phones, and touch screens generally. Desktop
 * Safari tints its tab bar from theme-color too, so the media query keeps the
 * desktop site exactly as it was.
 */
export const MOBILE_MQ = "(max-width: 639px), (pointer: coarse)";

/** The site grey, which is what most pages open on. */
export const SITE_TOP = "#d4d4d4";

/** A page's opening status-bar colour, for its viewport export. */
export const mobileThemeColor = (color: string) => [{ media: MOBILE_MQ, color }];
