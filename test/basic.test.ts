import { ruleName } from '../src';

describe('basic', () => {
  it('ruleName', () => {
    expect(ruleName).toEqual('subsetcss/config');
  });
});
