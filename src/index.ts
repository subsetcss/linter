'use strict';

import path from 'path';
import stylelint from 'stylelint';
import valueParser from 'postcss-value-parser';
import {
  getSubsetConfig,
  Subsets,
  SubsetFunc,
  mapSubset,
} from '@subsetcss/parser';
import postcss from 'postcss';

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

export default stylelint.createPlugin(ruleName, function(
  configPath,
  configObject
) {
  const config = configObject
    ? configObject
    : require(path.join(process.cwd(), configPath));

  return function(postcssRoot, postcssResult) {
    let validOptions = stylelint.utils.validateOptions(postcssResult, ruleName);
    if (!validOptions) {
      return;
    }

    postcssRoot.walkDecls(decl => {
      let rootConfig = getSubsetConfig(config, decl);
      let subset = rootConfig ? rootConfig.subsets[decl.prop] : undefined;

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

          mapSubset(alternates, decl.prop, decl.value).forEach((alt, index) => {
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

function checkAgainstSubset(
  decl: postcss.Declaration,
  message,
  subset: string[] | SubsetFunc,
  postcssResult: postcss.Result
) {
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
    subset = subset(message.prop, message.value);
  }
  if (Array.isArray(subset)) {
    let parsed = valueParser(value);
    let words = parsed.nodes.filter(
      (node: ValueParserNode) => node.type === 'word'
    );
    debugger;
    console.log(words);

    let valueNotInSubset = words.some((node: ValueParserNode) => {
      return !subset.includes(node.value);
    });
    // debugger;
    // let valueNotInSubset = !subset.includes(value);
    if (valueNotInSubset) {
      stylelint.utils.report({
        ruleName: ruleName,
        result: postcssResult,
        node: decl,
        message: messages.invalid(message.prop, message.value, subset, altProp),
      });
    }
  } else {
    throw new Error(
      `The subset value for ${message.prop} should be an array or a function that returns an array`
    );
  }
}

interface ValueParserNode {
  type: string;
  value: string;
}
