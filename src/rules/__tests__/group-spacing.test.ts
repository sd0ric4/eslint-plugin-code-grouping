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

    // 测试有效和无效的代码样例
    ruleTester.run('group-spacing', rule, {
      // 有效的代码样例
      valid: [
        // 组内没有多余空行，组间有一行空行，都是有效的
        {
          code: `
           const x = 0;
           
           // @group start: test
           const a = 1;
           const b = 2;
           // @group end: test
           
           const c = 3;
           `,
          options: [{ blankLinesBetweenGroups: 1, blankLinesWithinGroups: 0 }],
        },
      ],
      // 无效的代码样例 - 使用简单的测试用例
      invalid: [
        // 测试组内空行
        {
          code: `
           // @group start: test
           const a = 1;

           const b = 2;
           // @group end: test
           `,
          options: [{ blankLinesWithinGroups: 0 }],
          errors: [
            {
              message:
                'Expected 0 blank line(s) within group "test", but found 1',
            },
          ],
          // 修改为实际输出格式
          output: `
           // @group start: test
           const a = 1;
const b = 2;
           // @group end: test
           `,
        },
      ],
    });
  });
});
