import stylelint, { LinterOptions, Warning, LinterResult } from 'stylelint';
import { ruleName } from '../src';
import { SubsetConfig } from '@subsetcss/parser';

function getOptions(
  code: string,
  config: SubsetConfig
): Partial<LinterOptions> {
  return {
    code,
    configBasedir: __dirname,
    config: {
      plugins: ['../dist'],
      rules: {
        [ruleName]: [true, config],
      },
    },
  };
}

function getWarnings(result: LinterResult): Warning[] {
  let output = JSON.parse(result.output)[0];
  let warnings = output.warnings as Warning[];
  return warnings;
}

// const config = {
//   subsets: {
//     'font-size': ['0.25em', '0.5em', '0.75em', '1em'],
//   },
//   '@media': [
//     {
//       type: 'print',
//       params: {
//         'max-width': ['400px'],
//       },
//       subsets: {
//         'font-size': ['0.5em', '1em'],
//       },
//     },
//   ],
// };

describe('basic', () => {
  it('root subset', async () => {
    const code = `.test { font-size: 12px }`;
    const config = {
      subsets: {
        'font-size': ['0.25em', '0.5em', '0.75em', '1em'],
      },
    };

    let result: LinterResult = await stylelint.lint(getOptions(code, config));

    expect(result.errored).toBe(true);
    let warnings = getWarnings(result);
    expect(warnings[0].text).toBe(
      'Invalid `font-size: 12px`. It should use one of the following values: 0.25em, 0.5em, 0.75em, 1em. (subsetcss/config)'
    );
  });

  it('multiple valid values', async () => {
    const code = `.test { margin: 1em 0.5em }`;
    const config = {
      subsets: {
        margin: ['0.25em', '0.5em', '0.75em', '1em'],
      },
    };
    let result: LinterResult = await stylelint.lint(getOptions(code, config));

    expect(result.errored).toBe(false);
  });

  it('multiple values, some invalid', async () => {
    const code = `.test { margin: 1em 12px }`;
    const config = {
      subsets: {
        margin: ['0.25em', '0.5em', '0.75em', '1em'],
      },
    };
    let result: LinterResult = await stylelint.lint(getOptions(code, config));

    expect(result.errored).toBe(true);
    let warnings = getWarnings(result);
    expect(warnings[0].text).toBe(
      'Invalid `margin: 1em 12px`. It should use one of the following values: 0.25em, 0.5em, 0.75em, 1em. (subsetcss/config)'
    );
  });
});
