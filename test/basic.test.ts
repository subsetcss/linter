import stylelint, { LinterOptions, Warning, LinterResult } from 'stylelint';
import { ruleName } from '../src';

function getOptions(code, config): Partial<LinterOptions> {
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

const config = {
  subsets: {
    'font-size': ['0.25em', '0.5em', '0.75em', '1em'],
  },
  '@media': [
    {
      type: 'print',
      params: {
        'max-width': ['400px'],
      },
      subsets: {
        'font-size': ['0.5em', '1em'],
      },
    },
  ],
};

describe('basic', () => {
  it('root subset', async () => {
    const code = `.test { font-size: 12px }`;

    let result: LinterResult = await stylelint.lint(getOptions(code, config));

    expect(result.errored).toBe(true);
    let warnings = getWarnings(result);
    expect(warnings[0].text).toBe(
      'Invalid `font-size: 12px`. It should use one of the following values: 0.25em, 0.5em, 0.75em, 1em. (subsetcss/config)'
    );
  });
});
