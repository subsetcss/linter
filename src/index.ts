'use strict';

import path from 'path';
import stylelint from 'stylelint';
import valueParser from 'postcss-value-parser';
import { getSubsetConfig, Subsets } from '@subsetcss/parser';

const subsetMap: Subsets = {
  border: ['border-width', 'border-style', 'border-color'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  background: [],
};

export const ruleName = 'subsetcss/config';
export const messages = stylelint.utils.ruleMessages(ruleName, {
  invalid(prop, actual, subset, pieceProp) {
    let thing = pieceProp ? `The ${pieceProp}` : 'It';
    return `Invalid \`${prop}: ${actual}\`. ${thing} should use one of the following values: ${subset.join(
      ', '
    )}.`;
  },
});

export default stylelint.createPlugin(ruleName, function(configPath) {
  const config = require(path.join(process.cwd(), configPath));

  return function(postcssRoot, postcssResult) {
    let validOptions = stylelint.utils.validateOptions(postcssResult, ruleName);
    if (!validOptions) {
      return;
    }
    let processed: any[] = [];

    postcssRoot.walkDecls(decl => {
      let rootConfig = getSubsetConfig(config, decl);
      let subset = rootConfig ? rootConfig.subsets[decl.prop] : undefined;
      processed.push(decl);

      // Try alternates, maybe this rule is made up of multiple rules, like `border`.
      if (!subset) {
        let alternates = subsetMap[decl.prop];

        if (alternates) {
          let parsed = valueParser(decl.value);
          let values: string[] = [];

          parsed.walk((item: ValueParserNode) => {
            if (item.type === 'word') {
              values.push(item.value);
            }
          });

          alternates.forEach((alt, index) => {
            let subset = config.subsets[alt];
            let value = values[index];

            checkValueAgainstSubset(decl, value, subset, postcssResult, alt);
          });
        }

        return;
      }

      checkAgainstSubset(
        decl,
        { prop: decl.prop, value: decl.value },
        subset,
        postcssResult
      );
    });
  };
});

function checkAgainstSubset(decl, message, subset, postcssResult) {
  return checkValueAgainstSubset(
    decl,
    message,
    decl.value,
    subset,
    postcssResult
  );
}

function checkValueAgainstSubset(
  decl,
  message,
  value,
  subset,
  postcssResult,
  altProp?: string
) {
  if (typeof subset === 'function') {
    subset = subset();
  }
  if (Array.isArray(subset)) {
    let valueNotInSubset = !subset.includes(value);
    if (valueNotInSubset) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: decl,
        message: messages.invalid(message.prop, message.value, subset, altProp),
      });
    }
  }
}

interface ValueParserNode {
  type: string;
  value: string;
}
