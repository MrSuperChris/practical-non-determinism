// Original vector emblems. Keep geometry in code so every size stays crisp.
const symbols=[
  '<path d="M48 10 60 36 86 48 60 60 48 86 36 60 10 48 36 36Z"/><path d="m48 24 8 24-8 24-8-24Z" fill="currentColor"/><circle cx="48" cy="48" r="5" fill="var(--emblem-paper)"/>',
  '<path d="m12 44 36-29 36 29M23 39v41h50V39M40 80V57h16v23"/><path d="M32 45h7v7h-7zM57 45h7v7h-7zM68 30V18h8v19"/><path d="M9 80h78M13 74V58m0 7-6-5m6 11 6-5"/>',
  '<rect x="12" y="21" width="59" height="41" rx="4"/><path d="M19 29h44v25H19zM31 62v10h22V62M25 73h34M24 39l-5 5 5 5m14-10 5 5-5 5M72 51l-15 28 7 4 15-28"/><path d="m76 50 2-9 8-3-2 9-8 7"/>',
  '<path d="M23 47V35q0-12 12-12h24q12 0 12 12v12M25 63h44M22 79v-9m50 9v-9M20 46q-9-3-9 6v16h74V52q0-9-10-6v16H21V46Z"/><path d="M68 12a12 12 0 1 0 16 16 13 13 0 0 1-16-16Z"/>',
  '<path d="M12 49h28v16q-2 14-14 14T12 65ZM40 52h5q12 8-5 15M55 49h28v16q-2 14-14 14T55 65ZM83 52h3q10 8-3 15M10 83h34m8 0h34"/><path d="M26 36q-7-6 0-12m43 12q7-6 0-12M35 12h28v18H47l-7 7v-7h-5Z"/>',
  '<path d="M10 21h51v34H10zM6 61h59l-4 5H12ZM19 34l-5 5 5 5m12-10 5 5-5 5m-7-14-3 18M56 71l17-10 17 10v17l-17 9-17-9Zm0 0 17 10 17-10M73 81v16"/><path d="m67 48 17-28 5 3-17 28-6 4Z"/>',
  '<path d="M15 16h47v67H15zM23 26h29m-29 9h29m-29 9h16M23 56h11m-11 9h11"/><ellipse cx="66" cy="76" rx="19" ry="7"/><path d="M47 76v8c0 9 38 9 38 0v-8"/><ellipse cx="66" cy="63" rx="15" ry="6"/><path d="M51 63v8c0 8 30 8 30 0v-8"/><circle cx="70" cy="36" r="14"/><path d="M70 27v18m5-15h-7q-8 6 3 7t-3 6"/>',
  '<path d="M15 17h66v67H15ZM15 39h66M15 61h66M39 25h18v6H39ZM39 47h18v6H39ZM39 69h18v6H39Z"/><path d="M11 87h74M22 11h53"/>',
  '<path d="M20 43h56v23q0 15-15 15H35q-15 0-15-15ZM16 41h64M31 37q17-14 34 0M43 28h10M20 48H9v11h11M76 48h11v11H76M14 87h68M38 21q-7-7 0-14m13 14q7-7 0-14"/>',
  '<path d="m16 44 17-4 12 19 34 11q10 3 8 14H12V68l4-24Z"/><path d="M12 76h74M37 48l-8 7m16 1-8 7m15-4-8 7M16 39l8-15 17 6M54 40h28m-25-9h19M57 50h30"/>',
  '<path d="M48 24q-17-13-35-7v60q18-5 35 8 17-13 35-8V17q-18-6-35 7ZM48 24v61M7 24v61q22-5 41 5 19-10 41-5V24M21 31q10-1 18 5m-18 6q10-1 18 5m-18 6q10-1 18 5M57 36q8-6 18-5m-18 16q8-6 18-5m-18 16q8-6 18-5"/>',
  '<circle cx="43" cy="41" r="29"/><ellipse cx="43" cy="41" rx="13" ry="29"/><path d="M15 33h56M15 49h56M43 12v58"/><circle cx="68" cy="69" r="13" fill="var(--emblem-paper)"/><path d="m77 78 13 13" stroke-width="6"/>',
  '<rect x="10" y="25" width="76" height="52" rx="6"/><path d="M17 32h62v37H17ZM32 13l16 12 16-12M31 85h34M41 77v8m14-8v8"/><path d="m40 41 19 10-19 10Z" fill="currentColor"/>',
  '<path d="M13 32h70v47H13ZM34 32V19h28v13M13 45q35 16 70 0M42 45h12v15H42ZM19 83h58"/><path d="M7 18h13m-7-7v14M75 11l3 5 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1Z"/>',
  '<path d="M48 75Q22 62 48 28q26 34 0 47ZM48 75Q12 78 13 46q26 1 35 29ZM48 75q36 3 35-29-26 1-35 29ZM16 82h64M26 89h44"/><circle cx="48" cy="14" r="5"/><path d="m23 22-5-5m55 5 5-5M6 69h6m72 0h6"/>',
  '<path d="m12 68 27-40 30 40M43 44l13-22 30 46M29 44l10 5 8-9M7 85h82M16 78V49m0 3L5 67h22Zm-3 21V40m0 4L60 66h28Z"/><circle cx="23" cy="19" r="8"/><path d="M34 88q11-13 22-8t8 12"/>'
];
const modes=[
 '<path d="M22 23h53v53H22Z"/><path d="m32 47 12 12 25-29" stroke-width="7"/>',
 '<path d="M33 14h30v23H33ZM13 57h30v23H13ZM54 57h30v23H54ZM48 37v12M28 57v-8h41v8"/>',
 '<path d="M48 83V41M48 55Q14 57 15 26q31-1 33 29ZM49 42Q48 12 80 14q1 29-31 28ZM26 83h44"/>',
 '<circle cx="48" cy="48" r="34"/><path d="m63 28-6 28-27 12 10-30Z"/><path d="m63 28-23 10 17 18Z" fill="currentColor"/>',
 '<path d="m60 14-5 18 12 11 17-6q1 23-24 22L29 86l-12-12 29-30Q35 19 60 14Z"/><circle cx="27" cy="75" r="3"/>',
 '<path d="m48 8 9 27 27-9-17 22 17 22-27-9-9 27-9-27-27 9 17-22-17-22 27 9Z"/><circle cx="48" cy="48" r="8"/>'
];
const tones=['gold','purple','navy','green','purple','purple','gold','navy','green','green','purple','navy','navy','navy','purple','green'];
export function emblem(index,{mode=false,className=''}={}){
 const shape=(mode?modes:symbols)[index]||symbols[0];
 return `<svg class="emblem ${mode?'mode-emblem':'category-emblem'} ${className} tone-${mode?'purple':tones[index]}" viewBox="0 0 128 140" aria-hidden="true" focusable="false"><path class="emblem-shadow" d="m64 3 53 28v75l-53 30-53-30V31Z"/><path class="emblem-frame" d="m64 8 48 26v69l-48 27-48-27V34Z"/><path class="emblem-inner" d="m64 14 42 23v62l-42 24-42-24V37Z"/><g class="emblem-symbol" transform="translate(28 31) scale(.75)" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">${shape}</g><path class="emblem-rivet" d="m64 5 3 4-3 4-3-4Zm0 120 3 4-3 4-3-4Z"/></svg>`;
}
export function orbit(){return `<svg class="orbit-chart" viewBox="0 0 320 320" aria-hidden="true"><g fill="none" stroke="currentColor"><circle cx="160" cy="160" r="144"/><circle cx="160" cy="160" r="133" stroke-dasharray="1 8"/><circle cx="160" cy="160" r="122"/><path d="M160 0v40m0 240v40M0 160h40m240 0h40M47 47l28 28m170 170 28 28M47 273l28-28M245 75l28-28"/><path d="m160 6 5 13-5 13-5-13Zm0 282 5 13-5 13-5-13ZM6 160l13-5 13 5-13 5Zm282 0 13-5 13 5-13 5Z" fill="currentColor"/><path d="M45 115q34-57 99-61M275 205q-34 57-99 61" stroke-dasharray="3 5"/></g></svg>`;}
