/*
#######################################################################
#
# Copyright (C) 2020-2024 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
/*
#######################################################################
#######               DO NOT MODIFY THIS FILE               ###########
#######################################################################
*/

import {test, expect} from 'vitest';
import {render} from '@testing-library/react';

import fs from 'fs';
import {readdir} from 'node:fs/promises';
import strip from 'strip-comments';

import App from '../App';

/*
 * Should be using at least 6 Material UI Components
 */
test('Using Material UI', async () => {
  render(<App />);
  const elements = document.querySelectorAll('[class^=Mui]');
  expect(elements.length).toBeGreaterThan(6);
});

/*
 * Should NOT be using Props in lieu of state/context.
 *
 * At most ten are allowed, at least two are required.
 *
 * If using a version of node earlier than v20 this test will pass
 * even if you are using Props, so make aure you have an up-to-date
 * version of node or you may get a nasty shock from the autograder.
 */
test('Suitable number of Components using Props', async () => {
  const files = await readdir('src', {recursive: true});
  let cnt = 0;
  for (const file of files) {
    if ((!file.startsWith(`__tests__`)) && file.endsWith(`.jsx`)) {
      const data = fs.readFileSync(`src/${file}`, {encoding: 'utf8'});
      const src = strip(data).replace(/(\r\n|\n|\r)/gm, '');
      if (src.includes('PropTypes') ||
        src.includes('propTypes') ||
        src.includes('prop-types')) {
        cnt++;
      }
    }
  }
  expect(cnt).toBeLessThan(11);
  expect(cnt).toBeGreaterThan(1);
});

/*
 * Should be using Context to share state between Components.
 */
test('Using Context', async () => {
  const files = await readdir('src', {recursive: true});
  let cnt = 0;
  for (const file of files) {
    if ((!file.startsWith(`__tests__`)) &&
        ((file.endsWith(`.jsx`) || file.endsWith(`.js`)))) {
      const data = fs.readFileSync(`src/${file}`, {encoding: 'utf8'});
      const src = strip(data).replace(/(\r\n|\n|\r)/gm, '');
      if (src.includes('createContext')) {
        cnt++;
      }
    }
  }
  expect(cnt).toBeGreaterThan(0);
});

/*
 * Should be using State at least four times.
 */
test('Using State', async () => {
  const files = await readdir('src', {recursive: true});
  let cnt = 0;
  for (const file of files) {
    if ((!file.startsWith(`__tests__`)) &&
        ((file.endsWith(`.jsx`) || file.endsWith(`.js`)))) {
      const data = fs.readFileSync(`src/${file}`, {encoding: 'utf8'});
      const src = strip(data).replace(/(\r\n|\n|\r)/gm, '');
      if (src.includes('useState')) {
        cnt++;
      }
    }
  }
  expect(cnt).toBeGreaterThan(3);
});
