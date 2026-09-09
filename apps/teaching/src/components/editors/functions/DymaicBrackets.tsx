// const getImgBracket = (bracketName: string) => {
//   const imgUrl = `${fileUrl}/${bracketName}`;
//   const html = `<table cellspacing="0" cellpadding="0" border="0"
//   style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
//   >
//         <tr>
//           <td><img src="${imgUrl}" alt="${bracketName}" /></td>
//         </tr>
//     </table>&nbsp;`;
//   return html;
// };

export const VerticalLine = (row: number) => {
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `
          <svg width="4" height="60" viewBox="0 0 4 60" xmlns="http://www.w3.org/2000/svg">
  <line x1="2" y1="0" x2="2" y2="60" stroke="currentColor" stroke-width="2" />
</svg> `
              : `
          <svg width="4" height="90" viewBox="0 0 4 90" xmlns="http://www.w3.org/2000/svg">
  <line x1="2" y1="0" x2="2" y2="90" stroke="currentColor" stroke-width="2" />
</svg>`
          }
          </td>
        </tr>
    </table>&nbsp;`;
};

export const RightSquareBracket = (row: number) => {
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
           ${
             row === 2
               ? `<svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      L15,5
      L15,55
      L5,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>
`
               : `<svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      L15,5
      L15,85
      L5,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
           }
          
          </td>
        </tr>
    </table>&nbsp;`;
};

export const LeftSquareBracket = (row: number) => {
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `<svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      L5,5
      L5,55
      L15,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
              : `
          <svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      L5,5
      L5,85
      L15,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
          }
          </td>
        </tr>
    </table>&nbsp;`;
};

export const LeftBracket = (row: number) => {
  // if (row === 2) return getImgBracket('left_bracket_2.png');
  // if (row === 3) return getImgBracket('left_bracket_3.png');
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `<svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      Q5,5 5,15
      L5,45
      Q5,55 15,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
              : `
          <svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      Q5,5 5,20
      L5,70
      Q5,85 15,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
          }
          </td>
        </tr>
    </table>&nbsp;`;
};

export const RightBracket = (row: number) => {
  // if (row === 2) return getImgBracket('right_bracket_2.png');
  // if (row === 3) return getImgBracket('right_bracket_3.png');
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `
          <svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      Q15,5 15,15
      L15,45
      Q15,55 5,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
              : `
          <svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      Q15,5 15,20
      L15,70
      Q15,85 5,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
          }
</td>
        </tr>
    </table>&nbsp;`;
};

export const LeftCurlyBracket = (row: number) => {
  // if (row === 3) return getImgBracket('left_curly_bracket_3.png');
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `
          <svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      Q5,5 5,15
      L5,23
      Q5,30 0,30
      Q5,30 5,37
      L5,45
      Q5,55 15,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg> `
              : `
          <svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M15,5
      Q5,5 5,23
      L5,37
      Q5,45 0,45
      Q5,45 5,53
      L5,67
      Q5,85 15,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
          }
</td>
        </tr>
    </table>&nbsp;`;
};

export const RightCurlyBracket = (row: number) => {
  // if (row === 3) return getImgBracket('right_curly_bracket_3.png');
  return `<table cellspacing="0" cellpadding="0" border="0"
  style="display: inline-table; border-collapse: collapse; vertical-align:middle;"
  >
        <tr>
          <td>
          ${
            row === 2
              ? `
          <svg width="20" height="60" viewBox="0 0 20 60" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      Q15,5 15,15
      L15,23
      Q15,30 20,30
      Q15,30 15,37
      L15,45
      Q15,55 5,55
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg>`
              : `
          <svg width="20" height="90" viewBox="0 0 20 90" xmlns="http://www.w3.org/2000/svg">
  <path
    d="
      M5,5
      Q15,5 15,23
      L15,37
      Q15,45 20,45
      Q15,45 15,53
      L15,67
      Q15,85 5,85
    "
    stroke="currentColor"
    fill="none"
    stroke-width="2"
  />
</svg> `
          }
</td>
        </tr>
    </table>&nbsp;`;
};
