'use client';

import { useState } from 'react';
import {
  TrendingUp, MousePointer, DollarSign, Target, Eye,
  Video, Users, ChevronDown, ChevronUp, Calendar, Building2
} from 'lucide-react';

// ─── BENCHMARKS ──────────────────────────────────────────────
const BENCHMARKS = {
  ctr:                    0.4,
  websiteCtr:             0.4,
  engagementRate:         2.5,
  videoViewThroughRate:   35,
  videoCompletionRate:    1.7,
  leadFormCompletionRate: 6.65,
};

// ─── HARDCODED REPORT DATA ────────────────────────────────────
const ENGAGEMENT_WEEKLY = [
  { week: 'Week 1', dates: 'Dec 01–07', ctr: 7.038, cpc: 0.82, engRate: 7.078, webClicks: 20, webCtr: 0.791, impressions: 2529, clicks: 178, spend: 146.66, days: 7 },
  { week: 'Week 2', dates: 'Dec 08–14', ctr: 7.245, cpc: 0.58, engRate: 7.473, webClicks: 35, webCtr: 0.998, impressions: 3506, clicks: 254, spend: 146.79, days: 7 },
  { week: 'Week 3', dates: 'Dec 15–21', ctr: 7.765, cpc: 0.83, engRate: 7.765, webClicks: 26, webCtr: 1.030, impressions: 2524, clicks: 196, spend: 163.52, days: 7 },
  { week: 'Week 4', dates: 'Dec 22–28', ctr: 8.643, cpc: 0.85, engRate: 8.748, webClicks: 20, webCtr: 1.048, impressions: 1909, clicks: 165, spend: 140.97, days: 7 },
  { week: 'Week 5', dates: 'Dec 29–Jan 04', ctr: 7.938, cpc: 0.90, engRate: 7.938, webClicks: 20, webCtr: 1.142, impressions: 1751, clicks: 139, spend: 124.97, days: 6 },
  { week: 'Week 6', dates: 'Jan 05', ctr: 11.386, cpc: 0.81, engRate: 11.881, webClicks: 5, webCtr: 2.475, impressions: 202, clicks: 23, spend: 18.55, days: 1 },
];

const ENGAGEMENT_DAILY = [
  { week: 'Week 1 (Dec 01–07)', rows: [
    { date: 'Mon Dec 01', ctr: '6.413%', cpc: '$0.90', engRate: '6.413%', webClicks: 3,  webCtr: '0.713%', impressions: 421,  clicks: 27,  spend: '$24.39' },
    { date: 'Tue Dec 02', ctr: '7.627%', cpc: '$1.03', engRate: '7.627%', webClicks: 4,  webCtr: '1.130%', impressions: 354,  clicks: 27,  spend: '$27.73' },
    { date: 'Wed Dec 03', ctr: '5.631%', cpc: '$0.87', engRate: '5.631%', webClicks: 3,  webCtr: '0.583%', impressions: 515,  clicks: 29,  spend: '$25.23' },
    { date: 'Thu Dec 04', ctr: '8.854%', cpc: '$0.77', engRate: '8.854%', webClicks: 5,  webCtr: '1.302%', impressions: 384,  clicks: 34,  spend: '$26.33' },
    { date: 'Fri Dec 05', ctr: '7.769%', cpc: '$0.71', engRate: '8.020%', webClicks: 3,  webCtr: '0.752%', impressions: 399,  clicks: 31,  spend: '$22.04' },
    { date: 'Sat Dec 06', ctr: '8.734%', cpc: '$0.66', engRate: '8.734%', webClicks: 2,  webCtr: '0.873%', impressions: 229,  clicks: 20,  spend: '$13.19' },
    { date: 'Sun Dec 07', ctr: '4.405%', cpc: '$0.78', engRate: '4.405%', webClicks: 0,  webCtr: '0.000%', impressions: 227,  clicks: 10,  spend: '$7.75'  },
  ]},
  { week: 'Week 2 (Dec 08–14)', rows: [
    { date: 'Mon Dec 08', ctr: '7.130%', cpc: '$0.63', engRate: '7.308%', webClicks: 4,  webCtr: '0.713%', impressions: 561,  clicks: 40,  spend: '$25.23' },
    { date: 'Tue Dec 09', ctr: '6.410%', cpc: '$0.58', engRate: '6.553%', webClicks: 2,  webCtr: '0.285%', impressions: 702,  clicks: 45,  spend: '$26.17' },
    { date: 'Wed Dec 10', ctr: '9.283%', cpc: '$0.56', engRate: '9.283%', webClicks: 6,  webCtr: '1.266%', impressions: 474,  clicks: 44,  spend: '$24.64' },
    { date: 'Thu Dec 11', ctr: '7.592%', cpc: '$0.65', engRate: '8.026%', webClicks: 5,  webCtr: '1.085%', impressions: 461,  clicks: 35,  spend: '$22.78' },
    { date: 'Fri Dec 12', ctr: '6.993%', cpc: '$0.61', engRate: '7.692%', webClicks: 8,  webCtr: '1.399%', impressions: 572,  clicks: 40,  spend: '$24.40' },
    { date: 'Sat Dec 13', ctr: '6.226%', cpc: '$0.46', engRate: '6.226%', webClicks: 9,  webCtr: '1.698%', impressions: 530,  clicks: 33,  spend: '$15.16' },
    { date: 'Sun Dec 14', ctr: '8.252%', cpc: '$0.49', engRate: '8.252%', webClicks: 1,  webCtr: '0.485%', impressions: 206,  clicks: 17,  spend: '$8.41'  },
  ]},
  { week: 'Week 3 (Dec 15–21)', rows: [
    { date: 'Mon Dec 15', ctr: '8.088%', cpc: '$0.86', engRate: '8.088%', webClicks: 5,  webCtr: '1.225%', impressions: 408,  clicks: 33,  spend: '$28.48' },
    { date: 'Tue Dec 16', ctr: '7.973%', cpc: '$0.76', engRate: '7.973%', webClicks: 1,  webCtr: '0.228%', impressions: 439,  clicks: 35,  spend: '$26.75' },
    { date: 'Wed Dec 17', ctr: '6.780%', cpc: '$0.90', engRate: '6.780%', webClicks: 6,  webCtr: '1.453%', impressions: 413,  clicks: 28,  spend: '$25.12' },
    { date: 'Thu Dec 18', ctr: '6.342%', cpc: '$0.89', engRate: '6.342%', webClicks: 4,  webCtr: '0.846%', impressions: 473,  clicks: 30,  spend: '$26.75' },
    { date: 'Fri Dec 19', ctr: '8.333%', cpc: '$0.78', engRate: '8.333%', webClicks: 4,  webCtr: '1.075%', impressions: 372,  clicks: 31,  spend: '$24.13' },
    { date: 'Sat Dec 20', ctr: '9.160%', cpc: '$0.81', engRate: '9.160%', webClicks: 3,  webCtr: '1.145%', impressions: 262,  clicks: 24,  spend: '$19.39' },
    { date: 'Sun Dec 21', ctr: '9.554%', cpc: '$0.86', engRate: '9.554%', webClicks: 3,  webCtr: '1.911%', impressions: 157,  clicks: 15,  spend: '$12.90' },
  ]},
  { week: 'Week 4 (Dec 22–28)', rows: [
    { date: 'Mon Dec 22', ctr: '11.567%', cpc: '$0.75', engRate: '11.567%', webClicks: 5, webCtr: '1.866%', impressions: 268,  clicks: 31,  spend: '$23.38' },
    { date: 'Tue Dec 23', ctr: '10.373%', cpc: '$0.92', engRate: '10.373%', webClicks: 2, webCtr: '0.830%', impressions: 241,  clicks: 25,  spend: '$23.09' },
    { date: 'Wed Dec 24', ctr: '8.964%',  cpc: '$0.81', engRate: '8.964%',  webClicks: 7, webCtr: '1.961%', impressions: 357,  clicks: 32,  spend: '$26.04' },
    { date: 'Thu Dec 25', ctr: '6.702%',  cpc: '$0.96', engRate: '6.702%',  webClicks: 3, webCtr: '0.804%', impressions: 373,  clicks: 25,  spend: '$23.92' },
    { date: 'Fri Dec 26', ctr: '6.667%',  cpc: '$0.97', engRate: '6.667%',  webClicks: 1, webCtr: '0.317%', impressions: 315,  clicks: 21,  spend: '$20.34' },
    { date: 'Sat Dec 27', ctr: '8.962%',  cpc: '$0.93', engRate: '8.962%',  webClicks: 1, webCtr: '0.472%', impressions: 212,  clicks: 19,  spend: '$17.72' },
    { date: 'Sun Dec 28', ctr: '8.392%',  cpc: '$0.54', engRate: '9.790%',  webClicks: 1, webCtr: '0.699%', impressions: 143,  clicks: 12,  spend: '$6.48'  },
  ]},
  { week: 'Week 5 (Dec 29–Jan 04)', rows: [
    { date: 'Mon Dec 29', ctr: '9.281%',  cpc: '$0.71', engRate: '9.281%',  webClicks: 5, webCtr: '1.497%', impressions: 334,  clicks: 31,  spend: '$21.98' },
    { date: 'Tue Dec 30', ctr: '7.962%',  cpc: '$0.95', engRate: '7.962%',  webClicks: 5, webCtr: '1.592%', impressions: 314,  clicks: 25,  spend: '$23.76' },
    { date: 'Thu Jan 01', ctr: '7.372%',  cpc: '$0.94', engRate: '7.372%',  webClicks: 3, webCtr: '0.962%', impressions: 312,  clicks: 23,  spend: '$21.64' },
    { date: 'Fri Jan 02', ctr: '5.543%',  cpc: '$0.97', engRate: '5.543%',  webClicks: 3, webCtr: '0.665%', impressions: 451,  clicks: 25,  spend: '$24.20' },
    { date: 'Sat Jan 03', ctr: '11.702%', cpc: '$0.95', engRate: '11.702%', webClicks: 2, webCtr: '1.064%', impressions: 188,  clicks: 22,  spend: '$20.96' },
    { date: 'Sun Jan 04', ctr: '8.553%',  cpc: '$0.96', engRate: '8.553%',  webClicks: 2, webCtr: '1.316%', impressions: 152,  clicks: 13,  spend: '$12.43' },
  ]},
  { week: 'Week 6 (Jan 05)', rows: [
    { date: 'Mon Jan 05', ctr: '11.386%', cpc: '$0.81', engRate: '11.881%', webClicks: 5, webCtr: '2.475%', impressions: 202,  clicks: 23,  spend: '$18.55' },
  ]},
];

const LEADS_WEEKLY = [
  { week: 'Week 1', dates: 'Dec 04–10', leads: 2, cpl: 59.21,  spend: 118.43, days: 7 },
  { week: 'Week 2', dates: 'Dec 11–17', leads: 0, cpl: 0,      spend: 172.72, days: 7 },
  { week: 'Week 3', dates: 'Dec 18–24', leads: 1, cpl: 129.31, spend: 129.31, days: 7 },
  { week: 'Week 4', dates: 'Dec 25–31', leads: 2, cpl: 49.80,  spend: 99.59,  days: 7 },
  { week: 'Week 5', dates: 'Jan 01–06', leads: 2, cpl: 58.25,  spend: 116.51, days: 6 },
];

const LEADS_DAILY = [
  { week: 'Week 1 (Dec 04–10)', rows: [
    { date: 'Thu Dec 04', leads: 0, cpl: '€0.00', spend: '€14.20' },
    { date: 'Fri Dec 05', leads: 0, cpl: '€0.00', spend: '€17.40' },
    { date: 'Sat Dec 06', leads: 1, cpl: '€12.60', spend: '€12.60' },
    { date: 'Sun Dec 07', leads: 0, cpl: '€0.00', spend: '€12.80' },
    { date: 'Mon Dec 08', leads: 1, cpl: '€19.94', spend: '€19.94' },
    { date: 'Tue Dec 09', leads: 0, cpl: '€0.00', spend: '€20.35' },
    { date: 'Wed Dec 10', leads: 0, cpl: '€0.00', spend: '€21.14' },
  ]},
  { week: 'Week 2 (Dec 11–17)', rows: [
    { date: 'Thu Dec 11', leads: 0, cpl: '€0.00', spend: '€25.27' },
    { date: 'Fri Dec 12', leads: 0, cpl: '€0.00', spend: '€25.67' },
    { date: 'Sat Dec 13', leads: 0, cpl: '€0.00', spend: '€21.89' },
    { date: 'Sun Dec 14', leads: 0, cpl: '€0.00', spend: '€23.33' },
    { date: 'Mon Dec 15', leads: 0, cpl: '€0.00', spend: '€28.48' },
    { date: 'Tue Dec 16', leads: 0, cpl: '€0.00', spend: '€22.94' },
    { date: 'Wed Dec 17', leads: 0, cpl: '€0.00', spend: '€25.14' },
  ]},
  { week: 'Week 3 (Dec 18–24)', rows: [
    { date: 'Thu Dec 18', leads: 0, cpl: '€0.00',  spend: '€28.46' },
    { date: 'Fri Dec 19', leads: 0, cpl: '€0.00',  spend: '€27.38' },
    { date: 'Sat Dec 20', leads: 0, cpl: '€0.00',  spend: '€19.93' },
    { date: 'Sun Dec 21', leads: 0, cpl: '€0.00',  spend: '€15.92' },
    { date: 'Mon Dec 22', leads: 0, cpl: '€0.00',  spend: '€13.06' },
    { date: 'Tue Dec 23', leads: 0, cpl: '€0.00',  spend: '€13.84' },
    { date: 'Wed Dec 24', leads: 1, cpl: '€10.72', spend: '€10.72' },
  ]},
  { week: 'Week 4 (Dec 25–31)', rows: [
    { date: 'Thu Dec 25', leads: 0, cpl: '€0.00', spend: '€11.19' },
    { date: 'Fri Dec 26', leads: 0, cpl: '€0.00', spend: '€15.11' },
    { date: 'Sat Dec 27', leads: 2, cpl: '€6.57', spend: '€13.13' },
    { date: 'Sun Dec 28', leads: 0, cpl: '€0.00', spend: '€10.53' },
    { date: 'Mon Dec 29', leads: 0, cpl: '€0.00', spend: '€19.20' },
    { date: 'Tue Dec 30', leads: 0, cpl: '€0.00', spend: '€16.17' },
    { date: 'Wed Dec 31', leads: 0, cpl: '€0.00', spend: '€14.26' },
  ]},
  { week: 'Week 5 (Jan 01–06)', rows: [
    { date: 'Thu Jan 01', leads: 1, cpl: '€12.27', spend: '€12.27' },
    { date: 'Fri Jan 02', leads: 1, cpl: '€17.74', spend: '€17.74' },
    { date: 'Sat Jan 03', leads: 0, cpl: '€0.00',  spend: '€14.34' },
    { date: 'Sun Jan 04', leads: 0, cpl: '€0.00',  spend: '€17.13' },
    { date: 'Mon Jan 05', leads: 0, cpl: '€0.00',  spend: '€23.99' },
    { date: 'Tue Jan 06', leads: 0, cpl: '€0.00',  spend: '€31.04' },
  ]},
];

const VIDEO_WEEKLY = [
  { week: 'Week 1', dates: 'Dec 01–07',   views: 2227, viewRate: 33.12, cpv: 0.091, plays: 6725,  spend: 203.12, days: 7 },
  { week: 'Week 2', dates: 'Dec 08–14',   views: 2325, viewRate: 31.67, cpv: 0.080, plays: 7342,  spend: 187.01, days: 7 },
  { week: 'Week 3', dates: 'Dec 15–21',   views: 2899, viewRate: 33.98, cpv: 0.097, plays: 8532,  spend: 279.83, days: 7 },
  { week: 'Week 4', dates: 'Dec 22–28',   views: 2152, viewRate: 34.47, cpv: 0.136, plays: 6243,  spend: 293.46, days: 7 },
  { week: 'Week 5', dates: 'Dec 29–Jan 04', views: 2400, viewRate: 38.07, cpv: 0.134, plays: 6304, spend: 321.75, days: 7 },
  { week: 'Week 6', dates: 'Jan 05–06',   views: 640,  viewRate: 39.53, cpv: 0.118, plays: 1619,  spend: 75.53,  days: 2 },
];

const VIDEO_DAILY = [
  { week: 'Week 1 (Dec 01–07)', rows: [
    { date: 'Mon Dec 01', views: 311, plays: 957,  viewRate: '32.50%', cpv: '€0.096', spend: '€29.93' },
    { date: 'Tue Dec 02', views: 313, plays: 898,  viewRate: '34.86%', cpv: '€0.095', spend: '€29.76' },
    { date: 'Wed Dec 03', views: 398, plays: 1201, viewRate: '33.14%', cpv: '€0.084', spend: '€33.54' },
    { date: 'Thu Dec 04', views: 395, plays: 1163, viewRate: '33.96%', cpv: '€0.088', spend: '€34.76' },
    { date: 'Fri Dec 05', views: 383, plays: 1197, viewRate: '32.00%', cpv: '€0.086', spend: '€32.82' },
    { date: 'Sat Dec 06', views: 235, plays: 746,  viewRate: '31.50%', cpv: '€0.092', spend: '€21.72' },
    { date: 'Sun Dec 07', views: 192, plays: 563,  viewRate: '34.10%', cpv: '€0.107', spend: '€20.59' },
  ]},
  { week: 'Week 2 (Dec 08–14)', rows: [
    { date: 'Mon Dec 08', views: 339, plays: 1067, viewRate: '31.77%', cpv: '€0.081', spend: '€27.33' },
    { date: 'Tue Dec 09', views: 349, plays: 1085, viewRate: '32.17%', cpv: '€0.080', spend: '€27.90' },
    { date: 'Wed Dec 10', views: 351, plays: 1056, viewRate: '33.24%', cpv: '€0.088', spend: '€30.97' },
    { date: 'Thu Dec 11', views: 349, plays: 1028, viewRate: '33.95%', cpv: '€0.092', spend: '€32.18' },
    { date: 'Fri Dec 12', views: 444, plays: 1592, viewRate: '27.89%', cpv: '€0.069', spend: '€30.71' },
    { date: 'Sat Dec 13', views: 261, plays: 865,  viewRate: '30.17%', cpv: '€0.079', spend: '€20.63' },
    { date: 'Sun Dec 14', views: 232, plays: 649,  viewRate: '35.75%', cpv: '€0.075', spend: '€17.29' },
  ]},
  { week: 'Week 3 (Dec 15–21)', rows: [
    { date: 'Mon Dec 15', views: 385, plays: 1249, viewRate: '30.82%', cpv: '€0.070', spend: '€26.83' },
    { date: 'Tue Dec 16', views: 374, plays: 1187, viewRate: '31.51%', cpv: '€0.073', spend: '€27.48' },
    { date: 'Wed Dec 17', views: 357, plays: 997,  viewRate: '35.81%', cpv: '€0.077', spend: '€27.56' },
    { date: 'Thu Dec 18', views: 562, plays: 1823, viewRate: '30.83%', cpv: '€0.097', spend: '€54.72' },
    { date: 'Fri Dec 19', views: 573, plays: 1580, viewRate: '36.27%', cpv: '€0.108', spend: '€61.61' },
    { date: 'Sat Dec 20', views: 345, plays: 899,  viewRate: '38.38%', cpv: '€0.122', spend: '€42.03' },
    { date: 'Sun Dec 21', views: 303, plays: 797,  viewRate: '38.02%', cpv: '€0.131', spend: '€39.60' },
  ]},
  { week: 'Week 4 (Dec 22–28)', rows: [
    { date: 'Mon Dec 22', views: 340, plays: 966,  viewRate: '35.20%', cpv: '€0.134', spend: '€45.58' },
    { date: 'Tue Dec 23', views: 347, plays: 973,  viewRate: '35.66%', cpv: '€0.136', spend: '€47.10' },
    { date: 'Wed Dec 24', views: 347, plays: 1055, viewRate: '32.89%', cpv: '€0.136', spend: '€47.17' },
    { date: 'Thu Dec 25', views: 320, plays: 915,  viewRate: '34.97%', cpv: '€0.138', spend: '€44.10' },
    { date: 'Fri Dec 26', views: 333, plays: 971,  viewRate: '34.29%', cpv: '€0.139', spend: '€46.43' },
    { date: 'Sat Dec 27', views: 243, plays: 746,  viewRate: '32.57%', cpv: '€0.133', spend: '€32.20' },
    { date: 'Sun Dec 28', views: 222, plays: 617,  viewRate: '35.98%', cpv: '€0.139', spend: '€30.88' },
  ]},
  { week: 'Week 5 (Dec 29–Jan 04)', rows: [
    { date: 'Mon Dec 29', views: 366, plays: 1038, viewRate: '35.26%', cpv: '€0.125', spend: '€45.82' },
    { date: 'Tue Dec 30', views: 355, plays: 917,  viewRate: '38.71%', cpv: '€0.136', spend: '€48.14' },
    { date: 'Wed Dec 31', views: 319, plays: 867,  viewRate: '36.79%', cpv: '€0.139', spend: '€44.35' },
    { date: 'Thu Jan 01', views: 367, plays: 956,  viewRate: '38.39%', cpv: '€0.136', spend: '€50.09' },
    { date: 'Fri Jan 02', views: 394, plays: 1052, viewRate: '37.45%', cpv: '€0.140', spend: '€55.19' },
    { date: 'Sat Jan 03', views: 286, plays: 697,  viewRate: '41.03%', cpv: '€0.134', spend: '€38.38' },
    { date: 'Sun Jan 04', views: 313, plays: 777,  viewRate: '40.28%', cpv: '€0.127', spend: '€39.78' },
  ]},
  { week: 'Week 6 (Jan 05–06)', rows: [
    { date: 'Mon Jan 05', views: 304, plays: 824, viewRate: '36.89%', cpv: '€0.121', spend: '€36.81' },
    { date: 'Tue Jan 06', views: 336, plays: 795, viewRate: '42.26%', cpv: '€0.115', spend: '€38.72' },
  ]},
];

const WEBSITE_WEEKLY = [
  { week: 'Week 1', dates: 'Dec 01–07',   ctr: 4.838, cpc: 1.64, impressions: 7981,  clicks: 139, spend: 221.69, days: 7 },
  { week: 'Week 2', dates: 'Dec 08–14',   ctr: 1.224, cpc: 1.45, impressions: 11307, clicks: 121, spend: 185.37, days: 7 },
  { week: 'Week 3', dates: 'Dec 15–21',   ctr: 0.836, cpc: 1.53, impressions: 21045, clicks: 172, spend: 260.60, days: 7 },
  { week: 'Week 4', dates: 'Dec 22–28',   ctr: 1.249, cpc: 1.88, impressions: 11366, clicks: 141, spend: 266.56, days: 7 },
  { week: 'Week 5', dates: 'Dec 29–Jan 04', ctr: 1.375, cpc: 2.02, impressions: 11140, clicks: 145, spend: 293.60, days: 7 },
  { week: 'Week 6', dates: 'Jan 05–06',   ctr: 0.941, cpc: 1.91, impressions: 4687,  clicks: 44,  spend: 84.12,  days: 2 },
];

const WEBSITE_DAILY = [
  { week: 'Week 1 (Dec 01–07)', rows: [
    { date: 'Mon Dec 01', ctr: '2.023%',  cpc: '€1.59', impressions: 1384, clicks: 28, spend: '€44.56' },
    { date: 'Tue Dec 02', ctr: '3.171%',  cpc: '€2.37', impressions: 473,  clicks: 15, spend: '€35.59' },
    { date: 'Wed Dec 03', ctr: '1.236%',  cpc: '€1.84', impressions: 1699, clicks: 21, spend: '€38.72' },
    { date: 'Thu Dec 04', ctr: '1.879%',  cpc: '€1.29', impressions: 1597, clicks: 30, spend: '€38.72' },
    { date: 'Fri Dec 05', ctr: '1.326%',  cpc: '€1.24', impressions: 2262, clicks: 30, spend: '€37.21' },
    { date: 'Sat Dec 06', ctr: '2.007%',  cpc: '€2.06', impressions: 548,  clicks: 11, spend: '€22.62' },
    { date: 'Sun Dec 07', ctr: '22.222%', cpc: '€1.07', impressions: 18,   clicks: 4,  spend: '€4.27'  },
  ]},
  { week: 'Week 2 (Dec 08–14)', rows: [
    { date: 'Mon Dec 08', ctr: '1.690%', cpc: '€1.40', impressions: 1302, clicks: 22, spend: '€30.85' },
    { date: 'Tue Dec 09', ctr: '1.128%', cpc: '€1.72', impressions: 1773, clicks: 20, spend: '€34.47' },
    { date: 'Wed Dec 10', ctr: '1.200%', cpc: '€1.72', impressions: 1666, clicks: 20, spend: '€34.47' },
    { date: 'Thu Dec 11', ctr: '1.349%', cpc: '€1.50', impressions: 1705, clicks: 23, spend: '€34.47' },
    { date: 'Fri Dec 12', ctr: '0.521%', cpc: '€1.48', impressions: 3458, clicks: 18, spend: '€26.66' },
    { date: 'Sat Dec 13', ctr: '2.019%', cpc: '€1.60', impressions: 644,  clicks: 13, spend: '€20.76' },
    { date: 'Sun Dec 14', ctr: '0.659%', cpc: '€0.74', impressions: 759,  clicks: 5,  spend: '€3.69'  },
  ]},
  { week: 'Week 3 (Dec 15–21)', rows: [
    { date: 'Mon Dec 15', ctr: '0.602%', cpc: '€1.46', impressions: 3322, clicks: 20, spend: '€29.11' },
    { date: 'Tue Dec 16', ctr: '0.618%', cpc: '€1.45', impressions: 3074, clicks: 19, spend: '€27.52' },
    { date: 'Wed Dec 17', ctr: '1.148%', cpc: '€1.58', impressions: 1655, clicks: 19, spend: '€29.98' },
    { date: 'Thu Dec 18', ctr: '0.753%', cpc: '€1.62', impressions: 4517, clicks: 34, spend: '€55.01' },
    { date: 'Fri Dec 19', ctr: '1.090%', cpc: '€1.39', impressions: 3761, clicks: 41, spend: '€57.12' },
    { date: 'Sat Dec 20', ctr: '0.864%', cpc: '€1.56', impressions: 2663, clicks: 23, spend: '€35.86' },
    { date: 'Sun Dec 21', ctr: '0.779%', cpc: '€1.63', impressions: 2053, clicks: 16, spend: '€26.00' },
  ]},
  { week: 'Week 4 (Dec 22–28)', rows: [
    { date: 'Mon Dec 22', ctr: '1.117%', cpc: '€1.68', impressions: 2059, clicks: 23, spend: '€38.55' },
    { date: 'Tue Dec 23', ctr: '1.047%', cpc: '€1.81', impressions: 2196, clicks: 23, spend: '€41.53' },
    { date: 'Wed Dec 24', ctr: '1.377%', cpc: '€1.91', impressions: 2034, clicks: 28, spend: '€53.36' },
    { date: 'Thu Dec 25', ctr: '1.470%', cpc: '€1.98', impressions: 1905, clicks: 28, spend: '€55.31' },
    { date: 'Fri Dec 26', ctr: '1.177%', cpc: '€2.08', impressions: 1869, clicks: 22, spend: '€45.85' },
    { date: 'Sat Dec 27', ctr: '1.491%', cpc: '€1.92', impressions: 738,  clicks: 11, spend: '€21.08' },
    { date: 'Sun Dec 28', ctr: '1.062%', cpc: '€1.81', impressions: 565,  clicks: 6,  spend: '€10.88' },
  ]},
  { week: 'Week 5 (Dec 29–Jan 04)', rows: [
    { date: 'Mon Dec 29', ctr: '1.566%', cpc: '€2.00', impressions: 1596, clicks: 25, spend: '€49.94' },
    { date: 'Tue Dec 30', ctr: '0.826%', cpc: '€2.06', impressions: 2180, clicks: 18, spend: '€37.08' },
    { date: 'Wed Dec 31', ctr: '1.310%', cpc: '€2.04', impressions: 1832, clicks: 24, spend: '€49.02' },
    { date: 'Thu Jan 01', ctr: '1.532%', cpc: '€2.01', impressions: 1762, clicks: 27, spend: '€54.22' },
    { date: 'Fri Jan 02', ctr: '1.538%', cpc: '€2.03', impressions: 1625, clicks: 25, spend: '€50.80' },
    { date: 'Sat Jan 03', ctr: '0.996%', cpc: '€2.10', impressions: 1607, clicks: 16, spend: '€33.66' },
    { date: 'Sun Jan 04', ctr: '1.859%', cpc: '€1.89', impressions: 538,  clicks: 10, spend: '€18.88' },
  ]},
  { week: 'Week 6 (Jan 05–06)', rows: [
    { date: 'Mon Jan 05', ctr: '1.016%', cpc: '€1.91', impressions: 2263, clicks: 23, spend: '€43.98' },
    { date: 'Tue Jan 06', ctr: '0.866%', cpc: '€1.91', impressions: 2424, clicks: 21, spend: '€40.14' },
  ]},
];

// ─── SHARED COMPONENTS ───────────────────────────────────────

function BenchmarkBadge({ value, benchmark, higherIsBetter = true }) {
  const passing = higherIsBetter ? value >= benchmark : value <= benchmark;
  return passing ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
      ✓ Above benchmark
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      ↓ Below benchmark
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, benchmark, benchmarkValue, higherIsBetter = true }) {
  return (
    <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-blue-200 transition-all shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      {sub && <p className="text-xs text-gray-500 mb-2">{sub}</p>}
      {benchmark !== undefined && (
        <BenchmarkBadge value={benchmark} benchmark={benchmarkValue} higherIsBetter={higherIsBetter} />
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
      {children}
    </h3>
  );
}

function StatusBadge({ ok }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Active</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">⚠ Review</span>;
}

function CampaignBanner({ objective, campaign, budget, period, color }) {
  const colors = {
    blue:    'border-l-blue-500    bg-blue-50',
    indigo:  'border-l-indigo-500  bg-indigo-50',
    violet:  'border-l-violet-500  bg-violet-50',
    emerald: 'border-l-emerald-500 bg-emerald-50',
  };
  return (
    <div className={`border-l-4 rounded-r-xl p-4 mb-6 ${colors[color]}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Objective</span>
          <p className="text-sm font-bold text-gray-900">{objective}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Campaign</span>
          <p className="text-sm text-gray-700 truncate max-w-xs">{campaign}</p>
        </div>
        <div className="ml-auto text-right">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget · Period</span>
          <p className="text-sm text-gray-700">{budget} &nbsp;·&nbsp; {period}</p>
        </div>
      </div>
    </div>
  );
}

function WeeklyTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            {columns.map(c => (
              <th key={c} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-700 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DailyAccordion({ weeks, columns, getRow }) {
  const [openWeeks, setOpenWeeks] = useState({});
  const toggle = (i) => setOpenWeeks(prev => ({ ...prev, [i]: !prev[i] }));
  return (
    <div className="space-y-2">
      {weeks.map((week, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <span className="text-sm font-semibold text-gray-800">{week.week}</span>
            {openWeeks[i] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openWeeks[i] && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white border-t border-gray-100">
                    {columns.map(c => (
                      <th key={c} className="text-left px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {week.rows.map((row, j) => (
                    <tr key={j} className="border-t border-gray-50 hover:bg-gray-50">
                      {getRow(row).map((cell, k) => (
                        <td key={k} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── CONTEXT BAR ─────────────────────────────────────────────
function ContextBar({ selectedAccounts, allAccounts, startDate, endDate, activePreset }) {
  if (!selectedAccounts || selectedAccounts.length === 0) return null;

  const names = selectedAccounts
    .map(id => allAccounts?.find(a => a.clientId === id)?.clientName || `Account ${id}`)
    .slice(0, 3);
  const extra = selectedAccounts.length - 3;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100 text-xs">
      <div className="flex items-center gap-1.5 text-blue-700 font-medium">
        <Building2 className="w-3.5 h-3.5" />
        {names.join(', ')}{extra > 0 ? ` +${extra} more` : ''}
      </div>
      <div className="flex items-center gap-1.5 text-blue-600">
        <Calendar className="w-3.5 h-3.5" />
        {activePreset !== 'Custom' ? activePreset : `${startDate} → ${endDate}`}
      </div>
      <span className="ml-auto text-blue-500 italic">
        Showing report data for selected period
      </span>
    </div>
  );
}

// ─── OBJECTIVE TAB PANELS ─────────────────────────────────────

function EngagementTab() {
  return (
    <div>
      <CampaignBanner
        objective="Engagement"
        campaign="Ben v Cornell | Boosted User Post | ICP 1 | ABM | Mgmt | C02877"
        budget="$13.85/day"
        period="Dec 01 2025 – Jan 05 2026"
        color="indigo"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Spend"      value="$741.46"  sub="6 weeks"             icon={DollarSign} />
        <KpiCard label="Avg CTR"          value="7.69%"    sub="955 total clicks"     icon={TrendingUp}  benchmark={7.69}  benchmarkValue={BENCHMARKS.ctr} />
        <KpiCard label="Avg CPC"          value="$0.78"    sub="Across 6 weeks"       icon={DollarSign} />
        <KpiCard label="Engagement Rate"  value="7.79%"    sub="967 engagements"      icon={Users}       benchmark={7.79}  benchmarkValue={BENCHMARKS.engagementRate} />
        <KpiCard label="Web Visit Clicks" value="126"      sub="Total clicks"         icon={MousePointer} />
        <KpiCard label="Web CTR"          value="1.01%"    sub="Avg across weeks"     icon={Target}      benchmark={1.01}  benchmarkValue={BENCHMARKS.websiteCtr} />
      </div>

      <SectionTitle><TrendingUp className="w-4 h-4 text-blue-500" /> Week-by-Week Summary</SectionTitle>
      <WeeklyTable
        columns={['Week', 'CTR', 'CPC', 'Eng Rate', 'Web Clicks', 'Web CTR', 'Impressions', 'Clicks', 'Spend', 'Status']}
        rows={ENGAGEMENT_WEEKLY.map(w => [
          <span key={w.week}><span className="font-semibold text-gray-900">{w.week}</span><br /><span className="text-xs text-gray-400">{w.dates}</span></span>,
          `${w.ctr.toFixed(3)}%`, `$${w.cpc.toFixed(2)}`, `${w.engRate.toFixed(3)}%`,
          w.webClicks, `${w.webCtr.toFixed(3)}%`, w.impressions.toLocaleString(),
          w.clicks, `$${w.spend.toFixed(2)}`,
          <StatusBadge key="status" ok={true} />
        ])}
      />

      <SectionTitle><Eye className="w-4 h-4 text-blue-500" /> Daily Breakdown</SectionTitle>
      <DailyAccordion
        weeks={ENGAGEMENT_DAILY}
        columns={['Date', 'CTR', 'CPC', 'Eng Rate', 'Web Clicks', 'Web CTR', 'Impressions', 'Clicks', 'Spend']}
        getRow={r => [r.date, r.ctr, r.cpc, r.engRate, r.webClicks, r.webCtr, r.impressions.toLocaleString(), r.clicks, r.spend]}
      />
    </div>
  );
}

function LeadsTab() {
  return (
    <div>
      <CampaignBanner
        objective="Lead Generation"
        campaign="cTrader | Message | AWARE: Brokers | All Custom Audiences | C03510"
        budget="€27.85/day"
        period="Dec 04 2025 – Jan 06 2026"
        color="blue"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Spend"     value="€636.56"  sub="5 weeks"              icon={DollarSign} />
        <KpiCard label="Total Leads"     value="7"        sub="Across 5 weeks"        icon={Target} />
        <KpiCard label="Avg CPL"         value="€90.94"   sub="Cost per lead"         icon={DollarSign} />
        <KpiCard label="Best CPL"        value="€49.80"   sub="Week 4 · 2 leads"      icon={TrendingUp} />
        <KpiCard label="Form Opens"      value="—"        sub="Not in source data"    icon={MousePointer} />
        <KpiCard label="Completion Rate" value="—"        sub={`Benchmark: ${BENCHMARKS.leadFormCompletionRate}%`} icon={Target} />
      </div>

      <SectionTitle><TrendingUp className="w-4 h-4 text-blue-500" /> Week-by-Week Summary</SectionTitle>
      <WeeklyTable
        columns={['Week', 'Leads', 'CPL', 'Total Spend', 'Days Active', 'Status']}
        rows={LEADS_WEEKLY.map(w => [
          <span key={w.week}><span className="font-semibold text-gray-900">{w.week}</span><br /><span className="text-xs text-gray-400">{w.dates}</span></span>,
          w.leads,
          w.cpl > 0 ? `€${w.cpl.toFixed(2)}` : '€0.00',
          `€${w.spend.toFixed(2)}`,
          w.days,
          <StatusBadge key="status" ok={w.leads > 0} />
        ])}
      />

      <SectionTitle><Eye className="w-4 h-4 text-blue-500" /> Daily Breakdown</SectionTitle>
      <DailyAccordion
        weeks={LEADS_DAILY}
        columns={['Date', 'Leads', 'CPL', 'Spend']}
        getRow={r => [r.date, r.leads, r.cpl, r.spend]}
      />
    </div>
  );
}

function VideoTab() {
  return (
    <div>
      <CampaignBanner
        objective="Video Views"
        campaign="Cold Unaware | ICP 1.1: Brokers-Ops, F,P | Video Ad"
        budget="€30.00/day"
        period="Dec 01 2025 – Jan 06 2026"
        color="violet"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Spend"      value="€1,360.70" sub="6 weeks"                                         icon={DollarSign} />
        <KpiCard label="View Rate"        value="34.39%"    sub="Avg across weeks"                                icon={Video}      benchmark={34.39} benchmarkValue={BENCHMARKS.videoViewThroughRate} />
        <KpiCard label="Avg CPV"          value="€0.108"    sub="Cost per view"                                   icon={DollarSign} />
        <KpiCard label="Total Views"      value="12,643"    sub="36,765 total plays"                              icon={Eye} />
        <KpiCard label="50% View Rate"    value="—"         sub="Not in source data"                              icon={TrendingUp} />
        <KpiCard label="Completion Rate"  value="34.39%"    sub={`Benchmark: ${BENCHMARKS.videoCompletionRate}%`} icon={Target}     benchmark={34.39} benchmarkValue={BENCHMARKS.videoCompletionRate} />
      </div>

      <SectionTitle><TrendingUp className="w-4 h-4 text-blue-500" /> Week-by-Week Summary</SectionTitle>
      <WeeklyTable
        columns={['Week', 'Video Views', 'View Rate', 'CPV', 'Video Plays', 'Spend', 'Days', 'Status']}
        rows={VIDEO_WEEKLY.map(w => [
          <span key={w.week}><span className="font-semibold text-gray-900">{w.week}</span><br /><span className="text-xs text-gray-400">{w.dates}</span></span>,
          w.views.toLocaleString(),
          `${w.viewRate.toFixed(2)}%`,
          `€${w.cpv.toFixed(3)}`,
          w.plays.toLocaleString(),
          `€${w.spend.toFixed(2)}`,
          w.days,
          <StatusBadge key="status" ok={true} />
        ])}
      />

      <SectionTitle><Eye className="w-4 h-4 text-blue-500" /> Daily Breakdown</SectionTitle>
      <DailyAccordion
        weeks={VIDEO_DAILY}
        columns={['Date', 'Video Views', 'Video Plays', 'View Rate', 'CPV', 'Spend']}
        getRow={r => [r.date, r.views.toLocaleString(), r.plays.toLocaleString(), r.viewRate, r.cpv, r.spend]}
      />
    </div>
  );
}

function WebsiteTab() {
  return (
    <div>
      <CampaignBanner
        objective="Website Visits"
        campaign="Pain Points | Single Image | ICP 1.1: Brokers-Ops, F,P | Manual | C03482"
        budget="€33.87/day"
        period="Dec 01 2025 – Jan 06 2026"
        color="emerald"
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Spend"     value="€1,311.94" sub="6 weeks"                                   icon={DollarSign} />
        <KpiCard label="Avg CTR"         value="1.74%"     sub="762 total clicks"                          icon={TrendingUp} benchmark={1.74} benchmarkValue={BENCHMARKS.ctr} />
        <KpiCard label="Avg CPC"         value="€1.74"     sub="Across 6 weeks"                            icon={DollarSign} />
        <KpiCard label="Total Impr."     value="67,526"    sub="6 weeks"                                   icon={Eye} />
        <KpiCard label="Peak CTR"        value="4.84%"     sub="Week 1 · best week"                        icon={Target} />
        <KpiCard label="CTR Trend"       value="↘ Declining" sub="From Wk1 → Wk6"                         icon={TrendingUp} benchmark={0.94} benchmarkValue={BENCHMARKS.websiteCtr} />
      </div>

      <SectionTitle><TrendingUp className="w-4 h-4 text-blue-500" /> Week-by-Week Summary</SectionTitle>
      <WeeklyTable
        columns={['Week', 'Avg CTR', 'Avg CPC', 'Impressions', 'Clicks', 'Spend', 'Days', 'Status']}
        rows={WEBSITE_WEEKLY.map(w => [
          <span key={w.week}><span className="font-semibold text-gray-900">{w.week}</span><br /><span className="text-xs text-gray-400">{w.dates}</span></span>,
          `${w.ctr.toFixed(3)}%`,
          `€${w.cpc.toFixed(2)}`,
          w.impressions.toLocaleString(),
          w.clicks,
          `€${w.spend.toFixed(2)}`,
          w.days,
          <StatusBadge key="status" ok={w.ctr >= BENCHMARKS.ctr} />
        ])}
      />

      <SectionTitle><Eye className="w-4 h-4 text-blue-500" /> Daily Breakdown</SectionTitle>
      <DailyAccordion
        weeks={WEBSITE_DAILY}
        columns={['Date', 'CTR', 'CPC', 'Impressions', 'Clicks', 'Spend']}
        getRow={r => [r.date, r.ctr, r.cpc, r.impressions.toLocaleString(), r.clicks, r.spend]}
      />
    </div>
  );
}

// ─── OBJECTIVE TABS CONFIG ────────────────────────────────────
const OBJECTIVE_TABS = [
  { id: 'engagement', label: 'Engagement',    icon: Users,         component: EngagementTab, color: 'indigo' },
  { id: 'leads',      label: 'Lead Gen',      icon: Target,        component: LeadsTab,      color: 'blue' },
  { id: 'video',      label: 'Video Views',   icon: Video,         component: VideoTab,      color: 'violet' },
  { id: 'website',    label: 'Website Visits',icon: MousePointer,  component: WebsiteTab,    color: 'emerald' },
];

const COLOR_MAP = {
  indigo:  { active: 'border-indigo-600  text-indigo-600  bg-white', dot: 'bg-indigo-500' },
  blue:    { active: 'border-blue-600    text-blue-600    bg-white', dot: 'bg-blue-500' },
  violet:  { active: 'border-violet-600  text-violet-600  bg-white', dot: 'bg-violet-500' },
  emerald: { active: 'border-emerald-600 text-emerald-600 bg-white', dot: 'bg-emerald-500' },
};

// ─── MAIN EXPORT ─────────────────────────────────────────────
export default function ObjectiveTabs({ selectedAccounts = [], allAccounts = [], startDate, endDate, activePreset }) {
  const [activeTab, setActiveTab] = useState('engagement');
  const ActiveComponent = OBJECTIVE_TABS.find(t => t.id === activeTab)?.component ?? EngagementTab;
  const activeColor = OBJECTIVE_TABS.find(t => t.id === activeTab)?.color ?? 'indigo';

  return (
    <>
      {/* Context bar — shows selected accounts + date range */}
      <ContextBar
        selectedAccounts={selectedAccounts}
        allAccounts={allAccounts}
        startDate={startDate}
        endDate={endDate}
        activePreset={activePreset}
      />

      {/* Objective Tab Bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
        {OBJECTIVE_TABS.map(tab => {
          const Icon  = tab.icon;
          const active = activeTab === tab.id;
          const colors = COLOR_MAP[tab.color];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                active
                  ? `${colors.active} border-b-2`
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {active && <span className={`w-2 h-2 rounded-full ${colors.dot}`} />}
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {selectedAccounts.length === 0 ? (
          <div className="py-10 text-center">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Select accounts in the sidebar to view objective data</p>
          </div>
        ) : (
          <ActiveComponent />
        )}
      </div>
    </>
  );
}