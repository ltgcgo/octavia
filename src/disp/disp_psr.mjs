"use strict";

import {OctaviaDevice} from "../state/index.mjs";
import {RootDisplay} from "../basic/index.mjs";
import {MxFont40, MxBm256} from "../basic/mxReader.js";

import {
	inactivePixel,
	mediumPixel,
	activePixel
} from "./colour.js";

let PsrDisplay = class extends RootDisplay {
	// #okdb = new Uint8Array(61);
	#nkdb = new Uint8Array(61);
	// #osdb = new Uint8Array(22);
	#nsdb = new Uint8Array(22);
	#nadb = new Uint8Array(15);
	#bmdb = new Uint8Array(256);
	#bmst = 0;
	#bmex = 0;
	#ch = 0;
	#lastRefreshTime = 0;
	#letterShift = 0;
	#letterCoolDown = 0;
	#lastFrameBar = 0;
	#kana = "";
	#rhythmTextBuffer = "        ";
	xgFont = new MxFont40("./data/bitmaps/xg/font.tsv");
	trueFont = new MxFont40("./data/bitmaps/korg/font.tsv", "./data/bitmaps/xg/font.tsv");
	sysBm = new MxBm256("./data/bitmaps/xg/system.tsv");
	voxBm = new MxBm256("./data/bitmaps/xg/voices.tsv");
	aniBm = new MxBm256("./data/bitmaps/xg/animation.tsv");
	clefs = new Path2D("M110 163.5c0 -3.9 3.2 -7.1 7.1 -7.1s7.1 3.2 7.1 7.1s-3.2 7.1 -7.1 7.1s-7.1 -3.2 -7.1 -7.1zM110 128.5c0 -3.9 3.2 -7.1 7.1 -7.1s7.1 3.2 7.1 7.1s-3.2 7.1 -7.1 7.1s-7.1 -3.2 -7.1 -7.1zM64.5 109.2c24.1 0 41 12.3 41 35.1c0 36.8 -36.8 58 -72.2 72.9c-0.4 0.4 -0.8 0.6 -1.3 0.6c-1 0 -1.8 -0.8 -1.8 -1.8c0 -0.4 0.1 -0.8 0.6 -1.3c28.3 -16.5 57.7 -37.1 57.7 -69c0 -16.8 -8.8 -32.9 -23.9 -32.9c-10.4 0 -18.1 7.6 -21.6 17.6c1.5 -0.7 3.1 -1.1 4.8 -1.1c7.7 0 14 6.3 14 14c0 8.1 -6.2 14.8 -14 14.8c-8.4 0 -15.7 -6.6 -15.7 -14.8c0 -18.6 14.3 -34.2 32.5 -34.2z M408.6 181.3c0.6 0 1.3 -0.1 1.8 -0.1c21.7 0 35.8 17.9 35.8 36.5c0 10.6 -4.6 21.6 -15 29.4c-3.1 2.4 -6.6 3.9 -10.2 5c0.4 4.9 0.7 9.8 0.7 14.7c0 2.7 -0.1 5.5 -0.3 8.1c-1 16.8 -12.6 31.9 -29.1 31.9c-15.1 0 -27.3 -12.3 -27.3 -27.6c0 -8.1 7.4 -14.4 15.7 -14.4c7.6 0 13.3 6.6 13.3 14.4c0 7.3 -6 13.3 -13.3 13.3 c-1.5 0 -2.9 -0.3 -4.3 -0.8c3.6 5.5 9.5 9.1 16.4 9.1c13.4 0 22 -12.9 22.8 -26.7c0.1 -2.5 0.3 -5.2 0.3 -7.7c0 -4.3 -0.1 -8.5 -0.6 -12.9c-4.1 0.7 -8.1 1.1 -12.5 1.1c-26.3 0 -46.6 -24.1 -46.6 -52.4c0 -24.8 18.3 -42.8 34.7 -61.7c-2.7 -8.7 -5.2 -17.5 -6.3 -26.6c-0.8 -7.3 -1 -14.6 -1 -21.8c0 -16.1 7.7 -31.4 20.9 -40.9c0.4 -0.3 1 -0.4 1.4 -0.4c0.6 0 1 0 1.4 0.4 c9.9 11.8 18.6 34.3 18.6 50.1c0 20 -12 35.7 -25.2 51c2.9 9.5 5.5 19.3 7.8 29zM420.5 246.4c9.5 -3.4 15.8 -13.3 15.8 -23c0 -12.6 -9.2 -25.1 -24.2 -26.6c3.4 16.2 6.4 32.3 8.4 49.6zM366.4 214.1c0 18.9 18.1 34.6 37 34.6c3.9 0 7.7 -0.3 11.5 -0.8c-2 -17.8 -5.2 -34.3 -8.8 -51c-11.1 1.1 -17.4 8.5 -17.4 16.7 c0 6.2 3.5 12.7 11.3 17.2c0.7 0.7 1 1.4 1 2.1c0 1.5 -1.4 3.1 -3.1 3.1c-0.4 0 -0.8 -0.1 -1.3 -0.3c-11.2 -6 -16.4 -16.1 -16.4 -25.9c0 -12.3 8.1 -24.4 22.4 -27.6c-2 -8.1 -4.1 -16.4 -6.4 -24.5c-15 16.9 -29.8 34 -29.8 56.4zM413.1 71.7c-13.9 6.7 -22.7 20.9 -22.7 36.3c0 10.4 2.5 18.6 5 27.2 c11.2 -13.6 20.4 -27.7 20.4 -45.4c0 -7.7 -0.6 -11.1 -2.8 -18.1z");
	keyboard = new Path2D("M224 318 L380 318 L380 380 L224 380 Z M246 350 L246 380 M268 350 L268 380 M291 318 L291 380 M313 350 L313 380 M335 350 L335 380 M358 350 L358 380 M235 318 L235 350 L254 350 L254 318 M260 318 L260 350 L279 350 L279 318 M301 318 L301 350 L320 350 L320 318 M326 318 L326 350 L345 350 L345 318 M350 318 L350 350 L370 350 L370 318 M387 318 L543 318 L543 380 L387 380 Z M409 350 L409 380 M431 350 L431 380 M454 318 L454 380 M476 350 L476 380 M498 350 L498 380 M521 350 L521 380 M398 318 L398 350 L417 350 L417 318 M423 318 L423 350 L442 350 L442 318 M464 318 L464 350 L483 350 L483 318 M489 318 L489 350 L508 350 L508 318 M513 318 L513 350 L533 350 L533 318 M550 318 L706 318 L706 380 L550 380 Z M572 350 L572 380 M594 350 L594 380 M617 318 L617 380 M639 350 L639 380 M661 350 L661 380 M684 350 L684 380 M561 318 L561 350 L580 350 L580 318 M586 318 L586 350 L605 350 L605 318 M627 318 L627 350 L646 350 L646 318 M652 318 L652 350 L671 350 L671 318 M676 318 L676 350 L696 350 L696 318 M713 318 L869 318 L869 380 L713 380 Z M735 350 L735 380 M757 350 L757 380 M780 318 L780 380 M802 350 L802 380 M824 350 L824 380 M847 350 L847 380 M724 318 L724 350 L743 350 L743 318 M749 318 L749 350 L768 350 L768 318 M790 318 L790 350 L809 350 L809 318 M815 318 L815 350 L834 350 L834 318 M839 318 L839 350 L859 350 L859 318 M876 318 L1032 318 L1032 380 L876 380 Z M898 350 L898 380 M920 350 L920 380 M943 318 L943 380 M965 350 L965 380 M987 350 L987 380 M1010 350 L1010 380 M887 318 L887 350 L906 350 L906 318 M912 318 L912 350 L931 350 L931 318 M953 318 L953 350 L972 350 L972 318 M978 318 L978 350 L997 350 L997 318 M1002 318 L1002 350 L1022 350 L1022 318 M1032 318 L1055 318 L1055 380 L1032 380");
	bracket = new Path2D("M83 23 L49 23 L49 86 L83 86 M264 23 L297 23 L297 86 L264 86");
	staffLines = new Path2D("M30 110 L344 110 M356 110 L1074 110 M30 146 L344 146 M356 146 L1074 146 M30 182 L344 182 M356 182 L1074 182 M30 218 L344 218 M356 218 L1074 218 M30 254 L344 254 M356 254 L775 254 M894 254 L1074 254");
	downbeatStar = new Path2D("m 160.263,824.43605 c 0.939,1.039 1.482,2.434 1.482,3.833 0,1.402 -0.543,2.796 -1.482,3.834 1.038,-0.944 2.43,-1.483 3.837,-1.483 1.398,0 2.791,0.539 3.828,1.483 -0.948,-1.038 -1.482,-2.432 -1.482,-3.834 0,-1.399 0.534,-2.794 1.482,-3.833 -1.037,0.945 -2.43,1.483 -3.828,1.483 -1.407,0 -2.799,-0.538 -3.837,-1.483");
	downbeatHand = new Path2D("m 166.418,820.55105 c 0.13,0 0.253,-0.054 0.351,-0.143 0.089,-0.094 0.143,-0.223 0.143,-0.351 v -1.969 l 1.847,-6.897 c 0.706,-2.627 0.966,-5.371 0.78,-8.09 l -0.184,-2.644 1.188,-2.055 h -5.175 l -1.268,3.499 -1.278,-3.499 h -5.171 l 1.185,2.055 -0.185,2.644 c -0.185,2.719 0.076,5.463 0.782,8.09 l 1.847,6.897 v 1.969 c 0,0.128 0.054,0.257 0.145,0.351 0.089,0.089 0.218,0.143 0.348,0.143 h 0.214 c 0.423,0 0.841,-0.11 1.213,-0.321 0.364,-0.204 0.68,-0.509 0.9,-0.871 0.213,0.362 0.527,0.667 0.89,0.871 0.373,0.211 0.79,0.321 1.208,0.321 h 0.22 m -0.22,-1.304 c 0,0.111 -0.034,0.217 -0.095,0.303 -0.069,0.085 -0.164,0.147 -0.268,0.178 -0.103,0.024 -0.22,0.016 -0.317,-0.027 -0.315,-0.132 -0.588,-0.357 -0.78,-0.645 -0.185,-0.283 -0.289,-0.626 -0.289,-0.968 v -6.306 c 0.262,0.159 0.562,0.23 0.865,0.213 0.308,-0.023 0.595,-0.138 0.836,-0.329 0.233,-0.192 0.406,-0.454 0.488,-0.748 l 0.007,-0.017 c 0.379,-1.35 0.631,-2.734 0.747,-4.134 0.496,-0.497 0.797,-1.176 0.839,-1.876 0.046,-0.701 -0.172,-1.411 -0.591,-1.967 l -0.625,0.356 c 0.371,0.453 0.556,1.058 0.501,1.64 -0.054,0.584 -0.349,1.143 -0.801,1.517 -0.112,1.448 -0.365,2.889 -0.756,4.288 -0.055,0.178 -0.165,0.336 -0.323,0.436 -0.15,0.099 -0.343,0.145 -0.522,0.119 -0.184,-0.026 -0.356,-0.115 -0.472,-0.257 -0.124,-0.136 -0.193,-0.319 -0.193,-0.503 v -7.524 l 1.413,-3.887 h 3.453 l -0.687,1.18 0.199,2.865 c 0.186,2.636 -0.068,5.301 -0.756,7.853 l -1.873,6.989 z m -4.143,-1.251 -1.873,-6.989 c -0.681,-2.552 -0.94,-5.217 -0.755,-7.853 l 0.198,-2.865 -0.68,-1.18 h 3.446 l 1.412,3.887 v 7.524 c 0,0.184 -0.066,0.367 -0.185,0.503 -0.124,0.142 -0.295,0.231 -0.472,0.257 -0.185,0.026 -0.372,-0.02 -0.529,-0.119 -0.151,-0.1 -0.267,-0.258 -0.315,-0.436 -0.4,-1.399 -0.652,-2.84 -0.756,-4.288 -0.453,-0.374 -0.747,-0.933 -0.803,-1.517 -0.059,-0.582 0.125,-1.187 0.495,-1.64 l -0.618,-0.356 c -0.424,0.556 -0.637,1.266 -0.597,1.967 0.049,0.7 0.349,1.379 0.838,1.876 0.122,1.4 0.371,2.784 0.753,4.134 v 0.017 c 0.084,0.294 0.262,0.556 0.497,0.748 0.233,0.191 0.527,0.306 0.83,0.329 0.299,0.017 0.608,-0.054 0.862,-0.213 v 6.306 c 0,0.342 -0.095,0.685 -0.288,0.968 -0.184,0.288 -0.459,0.513 -0.774,0.645 -0.103,0.043 -0.212,0.051 -0.316,0.027 -0.104,-0.031 -0.199,-0.093 -0.268,-0.178 -0.069,-0.086 -0.102,-0.192 -0.102,-0.303 v -1.251");
	upbeatHand = new Path2D("m 143.496,764.85205 -1.915,5.26 c -0.152,0.404 -0.158,0.856 -0.029,1.267 0.13,0.408 0.406,0.767 0.756,1.01 0.356,0.244 0.795,0.362 1.221,0.338 l -1.483,4.067 c -0.15,0.417 -0.136,0.885 0.035,1.291 0.163,0.409 0.494,0.744 0.893,0.926 0.403,0.186 0.87,0.209 1.288,0.075 -0.06,0.409 0.02,0.841 0.234,1.199 0.213,0.357 0.557,0.63 0.949,0.765 0.397,0.133 0.835,0.123 1.219,-0.032 0.384,-0.155 0.714,-0.445 0.913,-0.813 0.22,0.315 0.563,0.543 0.941,0.628 0.369,0.084 0.781,0.03 1.118,-0.151 0.336,-0.183 0.603,-0.496 0.733,-0.858 l 0.885,-2.412 c 0.222,0.306 0.565,0.529 0.94,0.611 0.371,0.083 0.776,0.029 1.112,-0.158 0.338,-0.186 0.596,-0.494 0.726,-0.851 l 2.074,-5.687 c 0.988,-2.715 0.803,-5.834 -0.493,-8.414 v -0.005 l -7.014,-2.549 c -1.152,0.262 -2.237,0.812 -3.128,1.595 -0.886,0.779 -1.577,1.784 -1.975,2.898 m 9.357,8.148 -0.665,-0.24 -2.484,6.824 c -0.076,0.217 -0.247,0.402 -0.453,0.497 -0.212,0.099 -0.459,0.11 -0.679,0.031 -0.218,-0.079 -0.406,-0.246 -0.501,-0.455 -0.096,-0.213 -0.109,-0.46 -0.026,-0.68 l 2.482,-6.823 -0.666,-0.241 -2.845,7.822 c -0.098,0.261 -0.303,0.48 -0.551,0.6 -0.253,0.118 -0.556,0.13 -0.815,0.036 -0.261,-0.097 -0.482,-0.3 -0.597,-0.55 -0.118,-0.253 -0.13,-0.551 -0.041,-0.813 l 2.846,-7.826 -0.666,-0.24 -2.483,6.823 c -0.095,0.262 -0.294,0.482 -0.548,0.602 -0.256,0.117 -0.549,0.129 -0.809,0.033 -0.262,-0.095 -0.488,-0.298 -0.606,-0.548 -0.115,-0.253 -0.13,-0.552 -0.035,-0.814 l 1.662,-4.569 c 0.398,-0.227 0.706,-0.597 0.865,-1.023 l 1.091,-3.001 c 0.83,-0.093 1.625,-0.392 2.304,-0.868 0.674,-0.477 1.236,-1.124 1.6,-1.866 l -0.672,-0.248 c -0.351,0.683 -0.893,1.269 -1.545,1.671 -0.658,0.404 -1.421,0.625 -2.196,0.631 l -1.25,3.438 c -0.108,0.306 -0.341,0.563 -0.635,0.7 -0.295,0.136 -0.647,0.151 -0.955,0.04 -0.303,-0.11 -0.557,-0.345 -0.693,-0.637 -0.137,-0.294 -0.158,-0.646 -0.049,-0.955 l 1.923,-5.259 c 0.35,-0.967 0.94,-1.847 1.702,-2.542 0.767,-0.687 1.7,-1.193 2.695,-1.452 l 6.539,2.38 c 1.103,2.359 1.236,5.158 0.343,7.605 l -2.073,5.685 c -0.076,0.22 -0.246,0.404 -0.459,0.499 -0.205,0.101 -0.453,0.109 -0.671,0.033 -0.22,-0.08 -0.406,-0.248 -0.503,-0.457 -0.094,-0.212 -0.109,-0.461 -0.026,-0.68 l 1.145,-3.163 M 184.684,764.85205 c -0.405,-1.114 -1.093,-2.119 -1.985,-2.898 -0.883,-0.783 -1.974,-1.333 -3.128,-1.595 l -7.004,2.549 v 0.005 c -1.303,2.58 -1.49,5.699 -0.501,8.414 l 2.072,5.687 c 0.13,0.357 0.397,0.665 0.732,0.851 0.332,0.187 0.736,0.241 1.113,0.158 0.37,-0.082 0.712,-0.305 0.94,-0.611 l 0.88,2.412 c 0.13,0.362 0.397,0.675 0.739,0.858 0.336,0.181 0.741,0.235 1.12,0.151 0.368,-0.085 0.712,-0.313 0.94,-0.628 0.19,0.368 0.52,0.658 0.905,0.813 0.383,0.155 0.83,0.165 1.219,0.032 0.393,-0.135 0.735,-0.408 0.955,-0.765 0.213,-0.358 0.296,-0.79 0.227,-1.199 0.418,0.134 0.891,0.111 1.289,-0.075 0.398,-0.182 0.729,-0.517 0.9,-0.926 0.173,-0.406 0.179,-0.874 0.028,-1.291 l -1.481,-4.067 c 0.429,0.024 0.862,-0.094 1.219,-0.338 0.358,-0.243 0.625,-0.602 0.755,-1.01 0.138,-0.411 0.123,-0.863 -0.02,-1.267 l -1.914,-5.26 m -8.213,11.311 c 0.074,0.219 0.068,0.468 -0.035,0.68 -0.095,0.209 -0.282,0.377 -0.501,0.457 -0.211,0.076 -0.467,0.068 -0.673,-0.033 -0.212,-0.095 -0.377,-0.279 -0.459,-0.499 l -2.071,-5.685 c -0.886,-2.447 -0.762,-5.246 0.342,-7.605 l 6.539,-2.38 c 1,0.259 1.935,0.765 2.695,1.452 0.762,0.695 1.352,1.575 1.71,2.542 l 1.914,5.259 c 0.109,0.309 0.094,0.661 -0.041,0.955 -0.138,0.292 -0.398,0.527 -0.7,0.637 -0.309,0.111 -0.66,0.096 -0.948,-0.04 -0.294,-0.137 -0.534,-0.394 -0.643,-0.7 l -1.248,-3.438 c -0.771,-0.006 -1.539,-0.227 -2.192,-0.631 -0.657,-0.402 -1.192,-0.988 -1.55,-1.671 l -0.671,0.248 c 0.371,0.742 0.926,1.389 1.605,1.866 0.68,0.476 1.476,0.775 2.298,0.868 l 1.092,3.001 c 0.159,0.426 0.467,0.796 0.865,1.023 l 1.66,4.569 c 0.096,0.262 0.081,0.561 -0.035,0.814 -0.118,0.25 -0.336,0.453 -0.596,0.548 -0.261,0.096 -0.563,0.084 -0.816,-0.033 -0.248,-0.12 -0.454,-0.34 -0.551,-0.602 l -2.482,-6.823 -0.666,0.24 2.845,7.826 c 0.099,0.262 0.084,0.56 -0.032,0.813 -0.124,0.25 -0.343,0.453 -0.604,0.55 -0.261,0.094 -0.556,0.082 -0.811,-0.036 -0.253,-0.12 -0.451,-0.339 -0.548,-0.6 l -2.847,-7.822 -0.666,0.241 2.484,6.823 c 0.076,0.22 0.069,0.467 -0.033,0.68 -0.097,0.209 -0.282,0.376 -0.494,0.455 -0.221,0.079 -0.467,0.068 -0.68,-0.031 -0.214,-0.095 -0.379,-0.28 -0.459,-0.497 l -2.485,-6.824 -0.665,0.24 1.153,3.163");
	// noteHead = new Path2D("M220 138c56 0 109 -29 109 -91c0 -72 -56 -121 -103 -149c-36 -21 -76 -36 -117 -36c-56 0 -109 29 -109 91c0 72 56 121 103 149c36 21 76 36 117 36z");
	noteHead = new Path2D("M19.8 -12.4c5 0 9.8 2.6 9.8 8.2c0 6.5 -5 10.9 -9.3 13.4c-3.2 1.9 -6.8 3.2 -10.5 3.2c-5 0 -9.8 -2.6 -9.8 -8.2c0 -6.5 5 -10.9 9.3 -13.4c3.2 -1.9 6.8 -3.2 10.5 -3.2 z");
	sideIndicator1 = new Path2D("m 379.0355,823.51955 h -2.213 c -0.229,0 -0.436,-0.096 -0.587,-0.243 -0.162,-0.163 -0.243,-0.377 -0.243,-0.591 v -8.298 c 0,-0.229 0.092,-0.439 0.243,-0.586 0.162,-0.163 0.376,-0.244 0.587,-0.244 h 2.213 v -2.767 h -3.597 c -0.354,0 -0.708,0.136 -0.978,0.406 -0.251,0.251 -0.402,0.594 -0.402,0.977 v 12.726 c 0,0.356 0.133,0.709 0.402,0.98 0.251,0.251 0.598,0.406 0.978,0.406 h 3.597 v -2.766");
	sideIndicator2 = new Path2D("m 379.0085,813.83755 h -2.21 c -0.144,0 -0.285,0.054 -0.391,0.159 -0.1,0.105 -0.163,0.242 -0.159,0.395 0,0 0,8.281 -0.004,8.281 0,0.142 0.055,0.284 0.163,0.39 0.103,0.103 0.239,0.162 0.391,0.162 h 2.21 v -9.387");
	sharpSign = new Path2D("M216 -312c0 -10 -8 -19 -18 -19s-19 9 -19 19v145l-83 -31v-158c0 -10 -9 -19 -19 -19s-18 9 -18 19v145l-32 -12c-2 -1 -5 -1 -7 -1c-11 0 -20 9 -20 20v60c0 8 5 16 13 19l46 16v160l-32 -11c-2 -1 -5 -1 -7 -1c-11 0 -20 9 -20 20v60c0 8 5 15 13 18l46 17v158 c0 10 8 19 18 19s19 -9 19 -19v-145l83 31v158c0 10 9 19 19 19s18 -9 18 -19v-145l32 12c2 1 5 1 7 1c11 0 20 -9 20 -20v-60c0 -8 -5 -16 -13 -19l-46 -16v-160l32 11c2 1 5 1 7 1c11 0 20 -9 20 -20v-60c0 -8 -5 -15 -13 -18l-46 -17v-158zM96 65v-160l83 30v160z");
	flatSign = new Path2D("M27 41l-1 -66v-11c0 -22 1 -44 4 -66c45 38 93 80 93 139c0 33 -14 67 -43 67c-31 0 -52 -30 -53 -63zM-15 -138l-12 595c8 5 18 8 27 8s19 -3 27 -8l-7 -345c25 21 58 34 91 34c52 0 89 -48 89 -102c0 -80 -86 -117 -147 -169c-15 -13 -24 -38 -45 -38 c-13 0 -23 11 -23 25z");
	constructor() {
		super(new OctaviaDevice());
		let upThis = this;
		this.addEventListener("mode", function (ev) {
			(upThis.sysBm.getBm(`st_${({"gm":"gm1","g2":"gm2","?":"gm1","ns5r":"korg","ag10":"korg","x5d":"korg","05rw":"korg","krs":"korg","sg":"gm1","k11":"gm1","sd":"gm2","sc":"gs"})[ev.data] || ev.data}`) || []).forEach(function (e, i) {
				upThis.#bmdb[i] = e;
			});
			upThis.#bmst = 2;
			upThis.#bmex = Date.now() + 1600;
		});
		this.addEventListener("channelactive", (ev) => {
			this.#ch = ev.data;
		});
		this.addEventListener("metacommit", (ev) => {
			let meta = ev.data;
			if (meta.type === "SGLyrics" || meta.type === "C.Lyrics" || meta.type === "KarLyric") {
				this.#kana = meta.data;
			}
		});
	};
	setCh(ch) {
		this.#ch = ch;
	};
	getCh() {
		return this.#ch;
	};
	reset() {
		super.reset();
		if (this.demoInfo) {
			delete this.demoInfo;
		};
	};
	#render7seg(str, ctx, offsetX, offsetY, scaleX = 1, scaleY = 1, skew = -0.15) {
		let path = [
			new Path2D(),
			new Path2D("M36 160 L48 148 L144 148 L156 160 L144 172 L48 172 Z"),
			new Path2D("M32 156 L20 144 L20 48 L32 36 L44 48 L44 144 Z"),
			new Path2D("M32 284 L20 272 L20 176 L32 164 L44 176 L44 272 Z"),
			new Path2D("M156 288 L144 300 L48 300 L36 288 L48 276 L144 276 Z"),
			new Path2D("M160 164 L172 176 L172 272 L160 284 L148 272 L148 176 Z"),
			new Path2D("M160 36 L172 48 L172 144 L160 156 L148 144 L148 48 Z"),
			new Path2D("M36 32 L48 20 L144 20 L156 32 L144 44 L48 44 Z")
		];
		let sevenSegFont = {
			0: new Uint8Array([0, 0, 1, 1, 1, 1, 1, 1]),
			1: new Uint8Array([0, 0, 0, 0, 0, 1, 1, 0]),
			2: new Uint8Array([0, 1, 0, 1, 1, 0, 1, 1]),
			3: new Uint8Array([0, 1, 0, 0, 1, 1, 1, 1]),
			4: new Uint8Array([0, 1, 1, 0, 0, 1, 1, 0]),
			5: new Uint8Array([0, 1, 1, 0, 1, 1, 0, 1]),
			6: new Uint8Array([0, 1, 1, 1, 1, 1, 0, 1]),
			7: new Uint8Array([0, 0, 1, 0, 0, 1, 1, 1]),
			8: new Uint8Array([0, 1, 1, 1, 1, 1, 1, 1]),
			9: new Uint8Array([0, 1, 1, 0, 1, 1, 1, 1]),
			" ": new Uint8Array(8),
			A: new Uint8Array([0, 1, 1, 1, 0, 1, 1, 1]),
			B: new Uint8Array([0, 1, 1, 1, 1, 1, 0, 0]),
			C: new Uint8Array([0, 0, 1, 1, 1, 0, 0, 1]),
			D: new Uint8Array([0, 1, 0, 1, 1, 1, 1, 0]),
			E: new Uint8Array([0, 1, 1, 1, 1, 0, 0, 1]),
			F: new Uint8Array([0, 1, 1, 1, 0, 0, 0, 1]),
			G: new Uint8Array([0, 0, 1, 1, 1, 1, 0, 1]),
			H: new Uint8Array([0, 1, 1, 1, 0, 1, 1, 0]),
			I: new Uint8Array([0, 0, 1, 1, 0, 0, 0, 0]),
			J: new Uint8Array([0, 0, 0, 0, 1, 1, 1, 0]),
			K: new Uint8Array([0, 1, 1, 1, 0, 0, 1, 0]),
			L: new Uint8Array([0, 0, 1, 1, 1, 0, 0, 0]),
			M: new Uint8Array([0, 1, 0, 1, 0, 1, 0, 1]),
			N: new Uint8Array([0, 1, 0, 1, 0, 1, 0, 0]),
			O: new Uint8Array([0, 1, 0, 1, 1, 1, 0, 0]),
			P: new Uint8Array([0, 1, 1, 1, 0, 0, 1, 1]),
			Q: new Uint8Array([0, 1, 1, 0, 0, 1, 1, 1]),
			R: new Uint8Array([0, 1, 0, 1, 0, 0, 0, 0]),
			S: new Uint8Array([0, 0, 1, 0, 1, 1, 0, 1]),
			T: new Uint8Array([0, 1, 1, 1, 1, 0, 0, 0]),
			U: new Uint8Array([0, 0, 1, 1, 1, 1, 1, 0]),
			X: new Uint8Array([0, 0, 1, 1, 0, 1, 1, 0]),
			Y: new Uint8Array([0, 1, 1, 0, 1, 1, 1, 0]),
			Z: new Uint8Array([0, 0, 0, 1, 1, 0, 1, 1]),
			"-": new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0])
		};
		Array.from(str).forEach((e, i) => {
			ctx.setTransform(scaleX, 0, skew * scaleY, scaleY, 190 * scaleX * i + offsetX, offsetY);
			for (let i = 0; i < 8; i++) {
				ctx.fillStyle = sevenSegFont[e][i] ? activePixel : inactivePixel;
				ctx.fill(path[i]);
			}
		});
		ctx.resetTransform();
	};
	#renderDotMatrix(str, ctx, trueMode = false, offsetX, offsetY, cursor = -1, scaleX = 8, scaleY = 8, skew = -0.15) {
		let upThis = this;
		let timeNow = Date.now();
		ctx.setTransform(1, 0, skew, 1, 0, 0);
		// Determine the used font
		let usedFont = trueMode ? upThis.trueFont : upThis.xgFont;
		let longString = false;
		let originalLength = str.length;
		if (str.length > 8) {
			longString = true;
			str = `${str}  ${str.slice(0, 8)}`;
			str = str.slice(upThis.#letterShift, upThis.#letterShift + 8);
		} else {
			str = str.padEnd(8, " ");
		}
		usedFont.getStr(str).forEach((e, i) => {
			e.render((e, x, y) => {
				if (y === 7 && cursor === i) {
					ctx.fillStyle = e ? inactivePixel : activePixel;
				} else {
					ctx.fillStyle = e ? activePixel : inactivePixel;
				}
				ctx.fillRect(offsetX + (x + 6 * i) * scaleX, offsetY + y * scaleY, scaleX - 1, scaleY - 1);
			});
		});
		ctx.resetTransform();
		// Scrolling text
		if (longString && Math.floor(timeNow / 60) !== upThis.#lastRefreshTime) {
			if (upThis.#letterCoolDown > 0) {
				upThis.#letterCoolDown--;
			} else if (upThis.#letterShift > originalLength + 1) {
				upThis.#letterShift = 0;
				upThis.#letterCoolDown = 8;
			} else {
				upThis.#letterShift++;
				upThis.#letterCoolDown = 1;
			}
		} else if (!longString) {
			upThis.#letterShift = 0;
			upThis.#letterCoolDown = 0;
		}
		upThis.#lastRefreshTime = Math.floor(timeNow / 60);
	}
	render(time, ctx, backlightColor = "#b7bfaf64", mixerView, tempoView, id = 0, trueMode = false, rhythmView = true) {
		let sum = super.render(time);
		let upThis = this;
		let timeNow = Date.now();
		// Channel test
		let alreadyMin = false;
		let minCh = 0, maxCh = 0;
		sum.chInUse.forEach(function (e, i) {
			if (e) {
				if (!alreadyMin) {
					alreadyMin = true;
					minCh = i;
				};
				maxCh = i;
			};
		});
		let part = minCh >> 4;
		minCh = part << 4;
		maxCh = ((maxCh >> 4) << 4) + 15;
		if (this.#ch > maxCh) {
			this.#ch = minCh + this.#ch & 15;
		};
		if (this.#ch < minCh) {
			this.#ch = maxCh - 15 + (this.#ch & 15);
		};
		// Clear out the current working display buffer.
		this.#nkdb.forEach((e, i, a) => {a[i] = 0});
		this.#nsdb.forEach((e, i, a) => {a[i] = 0});
		this.#nadb.forEach((e, i, a) => {a[i] = 0});
		// Fill with white
		ctx.fillStyle = backlightColor;
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// Show text
		ctx.fillStyle = "#000c";
		ctx.textAlign = "left";
		ctx.font = '22px "Arial Web"';
		ctx.fillText("C4", 548, 399);
		ctx.strokeStyle = "#000c";
		ctx.stroke(upThis.bracket);
		ctx.stroke(upThis.staffLines);
		ctx.fill(upThis.clefs);
		ctx.stroke(upThis.keyboard);
		// Beat indicator
		if (sum.noteBeat & 1) {
			ctx.fillStyle = activePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2733);
			ctx.fill(upThis.upbeatHand);
			ctx.fillStyle = inactivePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
			ctx.fill(upThis.downbeatHand);
		}
		else {
			ctx.fillStyle = inactivePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2733);
			ctx.fill(upThis.upbeatHand);
			ctx.fillStyle = activePixel;
			ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
			ctx.fill(upThis.downbeatHand);
		}
		ctx.fillStyle = (sum.noteBeat < 1) ? activePixel : inactivePixel;
		ctx.setTransform(3.2, 0, 0, -3.2, 455, 2855);
		ctx.fill(upThis.downbeatStar);
		ctx.resetTransform();
		// Keyboard display
		// Reset the arrows
		let arrowLeft = new Path2D("M199 349 L214 329 L214 369 Z"),
		arrowRight = new Path2D("M1080 349 L1065 369 L1065 329 Z"),
		arrowLeftFlag = false,
		arrowRightFlag = false;
		let note;
		// Add all of the missing notes
		sum.extraNotes.forEach((ev) => {
			let {part, note, velo, state} = ev;
			if (state && velo) {
				sum.chKeyPr[part].set(note, {
					v: velo,
					s: state
				});
			};
		});
		// Main range
		for (let i = 36; i < 97; i++) {
			let pixel = 0,
			partInfo = sum.chKeyPr[this.#ch];
			if (partInfo?.has(i)) {
				pixel = partInfo.get(i).s < 4 ? 2 : 1;
			};
			this.#nkdb[i - 36] = pixel;
		};
		// Lower octaves
		for (let i = 0; i < 36; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				arrowLeftFlag = true;
				note = i % 12;
				let pixel = sum.chKeyPr[this.#ch]?.get(i).s < 4 ? 2 : 1;
				this.#nkdb[note] = Math.max(this.#nkdb[note], pixel);
			};
		};
		// Higher octaves
		for (let i = 97; i < 128; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				arrowRightFlag = true;
				note = (i - 1) % 12 + 1;
				let pixel = sum.chKeyPr[this.#ch]?.get(i).s < 4 ? 2 : 1;
				this.#nkdb[note + 48] = Math.max(this.#nkdb[note], pixel);
			};
		};
		// Render the arrows
		ctx.fillStyle = arrowLeftFlag ? activePixel : inactivePixel;
		ctx.fill(arrowLeft);
		ctx.fillStyle = arrowRightFlag ? activePixel : inactivePixel;
		ctx.fill(arrowRight);
		// Staff display
		let noteHeadPos = new Uint8Array([0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7]);
		let isBlackKey = new Uint8Array([0, 1, 0, 2, 0, 0, 1, 0, 2, 0, 2, 0]);
		let nadbIndex = new Uint8Array([0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 2, 0]);
		let bottomOctaveFlag1 = false,
		bottomOctaveFlag2 = false,
		topOctaveFlag1 = false,
		topOctaveFlag2 = false;
		// Main range
		for (let i = 48; i < 85; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				let pixel = sum.chKeyPr[this.#ch]?.get(i).s < 4 ? 2 : 1;
				this.#nsdb[(Math.floor(i / 12) - 4) * 7 + noteHeadPos[i % 12]] = pixel;
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] === 1) {
						this.#nadb[(Math.floor(i / 12) - 4) * 2 + nadbIndex[i % 12]] = pixel;
					}
					else {
						this.#nadb[(Math.floor(i / 12) - 4) * 3 + nadbIndex[i % 12] + 6] = pixel;
					}
				}
			}
		}
		// Lower octaves
		for (let i = 0; i < 48; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				let pixel = sum.chKeyPr[this.#ch]?.get(i).s < 4 ? 2 : 1;
				this.#nsdb[noteHeadPos[i % 12]] = Math.max(this.#nsdb[noteHeadPos[i % 12]], pixel);
				if (Math.floor(i / 12) === 3) {
					bottomOctaveFlag1 = true;
				}
				else {
					bottomOctaveFlag2 = true;
				}
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] === 1) {
						this.#nadb[nadbIndex[i % 12]] = Math.max(this.#nadb[nadbIndex[i % 12]], pixel);
					}
					else {
						this.#nadb[nadbIndex[i % 12] + 6] = Math.max(this.#nadb[nadbIndex[i % 12] + 6], pixel);
					}
				}
			}
		}
		// Higher octaves
		for (let i = 85; i < 128; i++) {
			if (sum.chKeyPr[this.#ch]?.has(i)) {
				let pixel = sum.chKeyPr[this.#ch]?.get(i).s < 4 ? 2 : 1;
				this.#nsdb[14 + noteHeadPos[(i - 1) % 12 + 1]] = Math.max(this.#nsdb[14 + noteHeadPos[(i - 1) % 12 + 1]], pixel);
				if (Math.floor((i - 1) / 12) === 7) {
					topOctaveFlag1 = true;
				}
				else {
					topOctaveFlag2 = true;
				}
				if (isBlackKey[i % 12]) {
					if (isBlackKey[i % 12] === 1) {
						this.#nadb[4 + nadbIndex[i % 12]] = Math.max(this.#nadb[4 + nadbIndex[i % 12]], pixel);
					}
					else {
						this.#nadb[12 + nadbIndex[i % 12]] = Math.max(this.#nadb[12 + nadbIndex[i % 12]], pixel);
					}
				}
			}
		}
		// Octave marks
		ctx.font = '24px "Arial Web"';
		ctx.fillStyle = bottomOctaveFlag1 ? activePixel : inactivePixel;
		ctx.fillText("8va", 280, 208);
		ctx.fillStyle = topOctaveFlag1 ? activePixel : inactivePixel;
		ctx.fillText("8va", 876, 70);
		ctx.fillStyle = bottomOctaveFlag2 ? activePixel : inactivePixel;
		ctx.fillText("15va+", 253, 244);
		ctx.fillStyle = topOctaveFlag2 ? activePixel : inactivePixel;
		ctx.fillText("15va+", 874, 40);
		// Temporary channel number display
		// this.#render7seg(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`, ctx, 32, 315, 0.24, 0.24);
		this.#render7seg(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`, ctx, 25, 260, 0.1, 0.1);
		// Measure / tempo view
		ctx.font = '23px "Arial Web"';
		ctx.fillStyle = tempoView ? inactivePixel : activePixel;
		ctx.fillText("MEASURE", 664, 296);
		ctx.fillStyle = tempoView ? activePixel : inactivePixel;
		ctx.fillText("TEMPO", 795, 242);
		if (tempoView) {
			this.#render7seg(Math.round(sum.tempo).toString().padStart(3, "0"), ctx, 791, 245, 0.17, 0.17);
		}
		else {
			this.#render7seg((sum.noteBar + 1).toString().padStart(3, "0"), ctx, 791, 245, 0.17, 0.17);
		}
		// Top 7-segment display
		if (rhythmView) {
			this.#render7seg(`${"ABCDEFGH"[this.#ch >> 4]}${((this.#ch & 15) + 1).toString().padStart(2, "0")}`, ctx, 112, 15, 0.24, 0.24);
		}
		else if (mixerView) {
			this.#render7seg(`${sum.chProgr[this.#ch] + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
		}
		else {
			this.#render7seg(`${id + 1}`.padStart(3, "0"), ctx, 112, 15, 0.24, 0.24);
		}
		// Top dot matrix display
		if (timeNow <= sum.letter.expire) {
			let letterDisp = sum.letter.text.trim();
			this.#renderDotMatrix(letterDisp, ctx, trueMode, 454, 32);
		}
		else {
			if (rhythmView) {
				let currentCursorPos = Math.round(sum.noteBeat * 2 - 0.5);
				if (sum.noteBar !== upThis.#lastFrameBar) {
					upThis.#rhythmTextBuffer = "        "; // cleat text buffer upon bar changing
				}
				// upThis.#rhythmTextBuffer += upThis.#kana;
				if (upThis.#kana !== "") {
					let arr = Array.from(upThis.#rhythmTextBuffer);
					// arr[currentCursorPos] = upThis.#kana;
					arr.splice(currentCursorPos, upThis.#kana.length, upThis.#kana);
					upThis.#rhythmTextBuffer = arr.join("");
				}
				this.#renderDotMatrix(this.#rhythmTextBuffer.slice(0, 8), ctx, trueMode, 454, 32, currentCursorPos);
				upThis.#lastFrameBar = sum.noteBar;
				upThis.#kana = ""; // clear lyric buffer upon each frame update
			}
			else if (mixerView) {
				this.#renderDotMatrix(upThis.getChVoice(this.#ch).name, ctx, trueMode, 454, 32);
			}
			else {
				let sngTtl = upThis.songTitle;
				while (sngTtl.indexOf("  ") > -1) {
					sngTtl = sngTtl.replaceAll("  ", " ");
				};
				this.#renderDotMatrix(sngTtl || "Unknown", ctx, trueMode, 454, 32);
			}
		}
		// Side indicator
		ctx.fillStyle = activePixel;
		ctx.setTransform(4.5, 0, 0, 4.5, -605, -3642);
		ctx.fill(upThis.sideIndicator1);
		ctx.fillStyle = mixerView ? inactivePixel : activePixel;
		ctx.fill(upThis.sideIndicator2);
		ctx.setTransform(4.5, 0, 0, 4.5, -605, -3484);
		ctx.fillStyle = mixerView ? activePixel : inactivePixel;
		ctx.fill(upThis.sideIndicator2);
		ctx.resetTransform();
		// Fetch voice bitmap
		// Commit to bitmap screen
		let useBm;
		if (timeNow <= sum.bitmap.expire) {
		// Use provided bitmap
			useBm = sum.bitmap.bitmap;
		} else if (this.demoInfo && time > 0) {
			let sequence = this.demoInfo.class || "boot";
			let stepTime = this.demoInfo.fps || 2;
			let stepSize = this.demoInfo.size || 4;
			let stepOffset = this.demoInfo.offset || 0;
			let stepFrame = Math.floor((time * stepTime + stepOffset) % stepSize);
			let stepId = `${sequence}_${stepFrame}`;
			//console.debug(stepId);
			useBm = this.aniBm?.getBm(stepId) || this.sysBm?.getBm(stepId) || this.sysBm?.getBm("no_abm");
			if (!useBm) {
				useBm = this.#bmdb.slice();
			};
		} else {
			// Use stored pic
			useBm = this.#bmdb.slice();
			if (timeNow >= this.#bmex) {
				this.#bmst = 0;
				let standard = upThis.getChVoice(this.#ch).standard.toLowerCase();
				useBm = this.voxBm.getBm(upThis.getChVoice(this.#ch).name) || this.voxBm.getBm(upThis.getVoice(upThis.device?.getChCc(upThis.#ch, 0), sum.chProgr[this.#ch], 0, sum.mode).name);
				if (["an", "ap", "dr", "dx", "pc", "pf", "sg", "vl"].indexOf(standard) > -1) {
					useBm = this.sysBm.getBm(`ext_${standard}`);
				};
				if (!useBm && (upThis.device?.getChCc(upThis.#ch, 0) < 48 || upThis.device?.getChCc(upThis.#ch, 0) === 56)) {
					useBm = this.voxBm.getBm(upThis.getVoice(0, sum.chProgr[this.#ch], 0, sum.mode).name)
				};
				if (!useBm && upThis.device?.getChCc(upThis.#ch, 0) === 126) {
					useBm = this.sysBm.getBm("cat_smpl");
				};
				if (!useBm && upThis.device?.getChCc(upThis.#ch, 0) === 64) {
					useBm = this.sysBm.getBm("cat_sfx");
				};
				if (!useBm) {
					useBm = this.sysBm.getBm("no_abm");
				};
			} else {
				if (this.#bmst === 2) {
					useBm.forEach((e, i, a) => {
						let crit = Math.floor((this.#bmex - timeNow) / 400);
						a[i] = crit % 2 === e;
					});
				};
			};
		}
		if (useBm) {
			useBm.width = useBm.length >> 4;
		};
		useBm?.render((e, x, y) => {
			ctx.fillStyle = e ? activePixel : inactivePixel;
			ctx.fillRect(224 + x * 6, 261 + y * 3, 5, 2);
		});
		// Chord display
		ctx.fillStyle = inactivePixel;
		ctx.font = '18px "Arial Web"';
		ctx.fillText("ACMP", 430, 275);
		ctx.fillText("ON", 430, 295);
		ctx.fill(new Path2D("M482 296 L482 312 L462 304 Z"));
		this.#render7seg(" ", ctx, 32, 300, 0.25, 0.25);
		ctx.font = 'bold 53px "Arial Web"';
		ctx.fillText("m", 82, 375);
		ctx.fillText("M", 130, 375);
		ctx.font = '40px "Arial Web"';
		ctx.fillText("7", 175, 375);
		ctx.font = '30px "Arial Web"';
		// ctx.fillText("♯", 82, 328);
		// ctx.fillText("♭", 105, 328);
		ctx.fillText("♯", 88, 328);
		ctx.fillText("♭", 113, 328);
		// ctx.fillText("6", 175, 328);
		ctx.fillText("6", 185, 328);
		// ctx.fillText("dim", 123, 328);
		ctx.fillText("dim", 132, 328);
		ctx.font = '25px "Arial Web"';
		ctx.fillText("♭  5", 105, 277);
		ctx.fillText("sus4", 157, 300);
		ctx.fillText("aug", 82, 300);
		ctx.fillText("(9)", 157, 277);
		// Commit to display accordingly.
		let keyboardData = new Uint16Array([228, 238.5, 250.3, 263.5, 272.6, 295, 304.5, 317.3, 330, 339.5, 354, 361.8]);
		this.#nkdb.forEach((e, i) => {
			ctx.fillStyle = [inactivePixel, mediumPixel, activePixel][e];
			let octave = Math.floor(i / 12), note = i % 12;
			if (i !== 60) {
				isBlackKey[note] ? ctx.fillRect(keyboardData[note] + 163 * octave, 321, 12, 26) : ctx.fillRect(keyboardData[note] + 163 * octave, 355, 14, 21);
			}
			else {
				ctx.fillRect(1036, 355, 14, 21);
			}
		});
		this.#nsdb.forEach((e, i) => {
			if (i < 7) {
				ctx.setTransform(1, 0, 0, 1, 100 + 36 * i, 200 - 18 * i);
			}
			else {
				ctx.setTransform(1, 0, 0, 1, 538 + 36 * (i - 7), 290 - 18 * (i - 7));
			}
			ctx.fillStyle = [inactivePixel, mediumPixel, activePixel][e];
			ctx.fill(upThis.noteHead);
			ctx.resetTransform();
		});
		// Accidentals
		let sharpPosX = new Uint16Array([82, 158, 488, 596, 740, 848]);
		let sharpPosY = new Uint16Array([200, 146, 290, 236, 164, 110]);
		let flatPosX = new Uint16Array([130, 230, 306, 560, 668, 704, 812, 920, 956]);
		let flatPosY = new Uint16Array([164, 110, 92, 254, 200, 182, 128, 74, 56]);
		this.#nadb.forEach((e, i) => {
			if (i < 6) {
				ctx.setTransform(0.03, 0, 0, -0.03, sharpPosX[i], sharpPosY[i]);
				ctx.fillStyle = [inactivePixel, mediumPixel, activePixel][e];
				ctx.fill(upThis.sharpSign);
				ctx.resetTransform();
			}
			else {
				ctx.setTransform(0.03, 0, 0, -0.03, flatPosX[i - 6], flatPosY[i - 6]);
				ctx.fillStyle = [inactivePixel, mediumPixel, activePixel][e];
				ctx.fill(upThis.flatSign);
				ctx.resetTransform();
			}
		});
		// Commit to old display buffer.
		/*
		this.#nkdb.forEach((e, i) => {
			if (this.#okdb[i] !== e) {
				this.#okdb[i] = e;
			};
		});
		this.#nsdb.forEach((e, i) => {
			if (this.#osdb[i] !== e) {
				this.#osdb[i] = e;
			};
		});
		*/
	}
};

export default PsrDisplay;
