const designTokens = {
  '--gray-0': {
    value: '#f8f9fa',
  },
  '--gray-1': {
    value: '#f1f3f5',
  },
  '--gray-2': {
    value: '#e9ecef',
  },
  '--gray-3': {
    value: '#dee2e6',
  },
  '--gray-4': {
    value: '#ced4da',
  },
  '--gray-5': {
    value: '#adb5bd',
  },
};

function tokens(keys) {
  return keys.filter(key => designTokens[key]).map(key => `var(${key})`);
}

let config = {
  subsets: {
    'font-size': ['0.25em', '0.5em', '0.75em', '1em'],
    color: tokens(['--gray-0', '--gray-1']),
  },
};

module.exports = {
  plugins: ['subsetcss'],
  rules: {
    'subsetcss/config': [true, config],
  },
};
