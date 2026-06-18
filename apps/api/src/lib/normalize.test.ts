import { describe, it, expect } from 'vitest';
import { normalize, sameNormalized } from './normalize';

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Oshodi  ')).toBe('oshodi');
  });

  it('strips the "Bus Stop" suffix so it collapses with the bare name', () => {
    expect(normalize('Oshodi Bus Stop')).toBe('oshodi');
    expect(normalize('Oshodi')).toBe('oshodi');
    expect(sameNormalized('Oshodi Bus Stop', 'oshodi')).toBe(true);
  });

  it('handles the common suffix variants', () => {
    expect(normalize('Ojota Under Bridge')).toBe('ojota');
    expect(normalize('Ikeja Terminal')).toBe('ikeja');
    expect(normalize('Mile 2 Park')).toBe('mile 2');
    expect(normalize('Yaba B/Stop')).toBe('yaba');
    expect(normalize('Allen Junction')).toBe('allen');
    expect(normalize('Ojuelegba Roundabout')).toBe('ojuelegba');
    expect(normalize('Oshodi Garage')).toBe('oshodi');
    expect(normalize('CMS BusStop')).toBe('cms');
  });

  it('removes punctuation and collapses internal whitespace', () => {
    expect(normalize('C.M.S.')).toBe('cms');
    expect(normalize('Mile  2,  Lagos')).toBe('mile 2 lagos');
    expect(normalize("Iddo's   Terminal")).toBe('iddos');
  });

  it('keeps multi-word names that contain no stop-type suffix intact', () => {
    expect(normalize('Murtala Muhammed International Airport')).toBe(
      'murtala muhammed international airport',
    );
    expect(normalize('National Theatre')).toBe('national theatre');
  });

  it('does not eat suffix words embedded inside a real token', () => {
    // \b boundaries: "Parkview" must not lose "park"
    expect(normalize('Parkview Estate')).toBe('parkview estate');
  });

  it('falls back to the cleaned full string when a name is only suffix words', () => {
    // Guard against every "... Bus Stop"-only entry collapsing to the same "".
    expect(normalize('Bus Stop')).toBe('bus stop');
    expect(normalize('Terminal')).toBe('terminal');
  });

  it('treats punctuation/casing variants of the same stop as equal', () => {
    expect(sameNormalized('CMS', 'C.M.S.')).toBe(true); // dots dropped, no spaces
    expect(sameNormalized('Mile 2', 'mile2')).toBe(false); // genuinely different tokens
  });
});
