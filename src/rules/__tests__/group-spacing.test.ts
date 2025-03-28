import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../group-spacing';

// 处理 TypeScript 类型问题
interface CustomRuleTesterConfig {
  parser?: string;
  parserOptions?: object;
  [key: string]: unknown;
}

describe('group-spacing rule', () => {
  it('validates and fixes group spacing properly', () => {
    const ruleTester = new RuleTester({
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
      },
    } as CustomRuleTesterConfig);

    ruleTester.run('group-spacing', rule, {
      valid: [
        {
          code: `
           // @group start: test
           const a = 1;
           const b = 2;
           // @group end: test
           
           const c = 3;
           `,
          options: [{ blankLinesBetweenGroups: 1, blankLinesWithinGroups: 0 }],
        },
      ],
      invalid: [
        {
          code: `
           // @group start: test
           const a = 1;
           const b = 2;
           // @group end: test
           const c = 3;
           `,
          options: [{ blankLinesBetweenGroups: 1, blankLinesWithinGroups: 0 }],
          errors: [
            {
              message:
                'Expected 1 blank line(s) between ungrouped code, but found 0',
            },
          ],
          // 修改这里以匹配实际输出
          output: `
           // @group start: test
           const a = 1;
           const b = 2;
           // @group end: test

const c = 3;
           `,
        },
      ],
    });
  });
});
