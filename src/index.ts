import groupSpacing from './rules/group-spacing';

export = {
  rules: {
    'group-spacing': groupSpacing,
  },
  configs: {
    recommended: {
      plugins: ['code-grouping'],
      rules: {
        'code-grouping/group-spacing': 'warn',
      },
    },
  },
};
