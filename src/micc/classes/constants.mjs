// 2022-2026 © Lightingale Community
// Licensed under GNU LGPL v3.0 license.

export default class MICCConstants {
	// MIDI event types.
	static MIDI_NOTE_OFF = 0x08;
	static MIDI_NOTE_ON = 0x09;
	static MIDI_NOTE_AT = 0x0a;
	static MIDI_CONTROL = 0x0b;
	static MIDI_PROGRAM = 0x0c;
	static MIDI_CH_AT = 0x0d;
	static MIDI_CH_PITCH = 0x0e;
	static MIDI_SYSEX_NEW = 0xf0;
	static MIDI_TIME_CODE = 0xf1;
	static MIDI_SONG_POSITION = 0xf2;
	static MIDI_SONG_SELECT = 0xf3;
	static MIDI_TUNE_REQUEST = 0xf6;
	static MIDI_SYSEX_RESUME = 0xf7;
	static MIDI_CLOCK = 0xf8;
	static MIDI_START = 0xfa;
	static MIDI_RESUME = 0xfb;
	static MIDI_STOP = 0xfc;
	static MIDI_ACTIVE_SENSE = 0xfe;
	static MIDI_RESET = 0xef;
	static MIDI_META = 0xff;
	// Sequence file types.
	static FILE_UNSET = 0xffff;
	// Exported MIDI sequence.
	static FILE_SMF_SINGLE = 0x0000;
	static FILE_SMF_MULTIPLE = 0x0001;
	static FILE_SMF_SEQUENTIAL = 0x0002;
	static FILE_SMF_CLIP = 0x0004;
	static FILE_SMF_KORG_SONG = 0x0008; // Not final.
	// Sequencer projects. Very rough patterns, don't apply to every single one.
	static FILE_SEQ_CAKEWALK = 0x1cae;
	static FILE_SEQ_SOL = 0x1501;
	static FILE_SEQ_XGWORKS = 0x1bcc; // I give up on this one.
	// Tracker formats. Bonus treat (not really) if you can spot how the tracker IDs are assigned!
	// https://milkytracker.org/docs/manual/MilkyTracker.html#formats
	static FILE_TRK_PRO = 0x2000; // 1987 (Ultimate Soundtracker), 1990 (ProTracker)
	static FILE_TRK_SOUNDFX = 0x2010; // 1988 (SoundFX)
	static FILE_TRK_OCTAMED = 0x2020; // 1989 (MED, OctaMED)
	static FILE_TRK_SCREAM2 = 0x2030; // 1990 (Scream Tracker 2)
	static FILE_TRK_ULTRA = 0x2060; // 1993 (UltraTracker)
	static FILE_TRK_FAST2 = 0x2070; // 1994 (Fast Tracker 2)
	static FILE_TRK_SCREAM3 = 0x2071; // 1994 (Scream Tracker 3)
	static FILE_TRK_IMPULSE = 0x2080; // 1995 (Impulse Tracker)
	static FILE_TRK_OPENMPT = 0x2110; // 2004 (OpenMPT)
};