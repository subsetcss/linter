import { ruleName } from '../src';

describe('basic', () => {
  it('ruleName', () => {
    expect(ruleName).toEqual('design-system/config');
  });
});
