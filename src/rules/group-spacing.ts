import { Rule } from 'eslint';
import { Comment, Node, Program } from 'estree';

interface GroupMarker {
  start: number;
  end?: number;
  name: string;
  nodes: Node[];
}

interface RuleOptions {
  blankLinesBetweenGroups?: number;
  blankLinesWithinGroups?: number;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description:
        'Enforce spacing between code groups marked with @group comments',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'whitespace',
    schema: [
      {
        type: 'object',
        properties: {
          blankLinesBetweenGroups: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          blankLinesWithinGroups: {
            type: 'integer',
            minimum: 0,
            default: 0,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const sourceCode = context.getSourceCode();
    const comments = sourceCode.getAllComments();
    const options = (context.options[0] as RuleOptions) || {};
    const blankLinesBetweenGroups = options.blankLinesBetweenGroups || 1;
    const blankLinesWithinGroups = options.blankLinesWithinGroups || 0;

    // 查找所有的组标记
    const groupMarkers: GroupMarker[] = [];
    let currentGroup: GroupMarker | null = null;

    comments.forEach((comment: Comment) => {
      const text = comment.value.trim();

      if (text.startsWith('@group start') || text.startsWith('@group-start')) {
        // 开始一个新组
        currentGroup = {
          start: comment.loc!.start.line,
          name: text.replace(/@group(-|\s)start:?\s?/, '').trim(),
          nodes: [],
        };
        groupMarkers.push(currentGroup);
      } else if (
        text.startsWith('@group end') ||
        text.startsWith('@group-end')
      ) {
        // 结束当前组
        if (currentGroup) {
          currentGroup.end = comment.loc!.start.line;
          currentGroup = null;
        }
      }
    });

    // 辅助函数：计算两行之间的注释数量
    function countCommentsBetweenLines(
      startLine: number,
      endLine: number
    ): number {
      return comments.filter(
        (comment) =>
          comment.loc!.start.line > startLine &&
          comment.loc!.start.line < endLine
      ).length;
    }

    return {
      Program(): void {
        // 处理所有节点，确定它们是否在组内
        const ast = sourceCode.ast as unknown as Program;
        const allNodes = ast.body;

        for (let i = 0; i < allNodes.length; i++) {
          const node = allNodes[i];
          const nodeLine = node.loc!.start.line;

          // 检查节点是否属于某个组
          let belongsToGroup = false;
          for (const group of groupMarkers) {
            if (
              group.start <= nodeLine &&
              (!group.end || nodeLine <= group.end)
            ) {
              group.nodes.push(node);
              belongsToGroup = true;
              break;
            }
          }

          // 如果当前节点与前一个节点之间需要空行
          if (i > 0) {
            const prevNode = allNodes[i - 1];
            const currLine = node.loc!.start.line;
            const prevLine = prevNode.loc!.end.line;

            // 计算注释行数量
            const commentLines = countCommentsBetweenLines(prevLine, currLine);

            // 实际空行 = 总行数 - 注释占用的行数 - 1
            const linesBetween = currLine - prevLine - 1 - commentLines;

            // 检查前一个节点和当前节点是否在同一组中
            let sameGroup = false;
            for (const group of groupMarkers) {
              if (
                group.nodes.includes(prevNode) &&
                group.nodes.includes(node)
              ) {
                sameGroup = true;
                break;
              }
            }

            if (sameGroup) {
              // 同一组内部的空行规则
              if (linesBetween !== blankLinesWithinGroups) {
                // 计算注释后的最后一行位置
                const commentsBetween = comments.filter(
                  (comment) =>
                    comment.loc!.start.line > prevLine &&
                    comment.loc!.start.line < currLine
                );

                context.report({
                  node,
                  message: `Expected ${blankLinesWithinGroups} blank line(s) within group, but found ${linesBetween}`,
                  fix(fixer) {
                    // 获取源代码的行分隔符
                    const text = sourceCode.getText();
                    const lineSeparator = text.includes('\r\n') ? '\r\n' : '\n';

                    // 找到前一个节点或注释的末尾和当前节点的开始之间的范围
                    const range: [number, number] = [
                      prevNode.range![1],
                      node.range![0],
                    ];

                    // 保持注释，但确保空行数量正确
                    const originalText = sourceCode.text.substring(
                      range[0],
                      range[1]
                    );

                    // 从最后一个注释后开始计算
                    let newText = originalText;
                    if (commentsBetween.length > 0) {
                      const lastCommentIndex =
                        commentsBetween[commentsBetween.length - 1].range![1] -
                        range[0];
                      const textAfterLastComment =
                        originalText.substring(lastCommentIndex);
                      const desiredNewlines = lineSeparator.repeat(
                        blankLinesWithinGroups + 1
                      );
                      newText =
                        originalText.substring(0, lastCommentIndex) +
                        desiredNewlines +
                        textAfterLastComment.trim();
                    } else {
                      newText = lineSeparator.repeat(
                        blankLinesWithinGroups + 1
                      );
                    }

                    return fixer.replaceTextRange(range, newText);
                  },
                });
              }
            } else if (!belongsToGroup) {
              // 不在任何组中的节点之间的空行规则
              if (linesBetween !== blankLinesBetweenGroups) {
                // 与上面的逻辑类似，但针对非组节点
                const commentsBetween = comments.filter(
                  (comment) =>
                    comment.loc!.start.line > prevLine &&
                    comment.loc!.start.line < currLine
                );

                context.report({
                  node,
                  message: `Expected ${blankLinesBetweenGroups} blank line(s) between ungrouped code, but found ${linesBetween}`,
                  fix(fixer) {
                    // 获取源代码的行分隔符
                    const text = sourceCode.getText();
                    const lineSeparator = text.includes('\r\n') ? '\r\n' : '\n';

                    // 找到前一个节点或注释的末尾和当前节点的开始之间的范围
                    const range: [number, number] = [
                      prevNode.range![1],
                      node.range![0],
                    ];

                    // 保持注释，但确保空行数量正确
                    const originalText = sourceCode.text.substring(
                      range[0],
                      range[1]
                    );

                    // 从最后一个注释后开始计算
                    let newText = originalText;
                    if (commentsBetween.length > 0) {
                      const lastCommentIndex =
                        commentsBetween[commentsBetween.length - 1].range![1] -
                        range[0];
                      const textAfterLastComment =
                        originalText.substring(lastCommentIndex);
                      const desiredNewlines = lineSeparator.repeat(
                        blankLinesBetweenGroups + 1
                      );
                      newText =
                        originalText.substring(0, lastCommentIndex) +
                        desiredNewlines +
                        textAfterLastComment.trim();
                    } else {
                      newText = lineSeparator.repeat(
                        blankLinesBetweenGroups + 1
                      );
                    }

                    return fixer.replaceTextRange(range, newText);
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
