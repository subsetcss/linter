'use strict';

import path from 'path';
import * as stylelint from 'stylelint';
import * as valueParser from 'postcss-value-parser';
import {
  getSubsetConfig,
  SubsetFunc,
  mapSubset,
  shorthandMap,
} from '@subsetcss/parser';
import type * as postcss from 'postcss';


const subsetMap = shorthandMap;

export const ruleName = 'subsetcss/config';

export const messages = stylelint.utils.ruleMessages(ruleName, {
  invalid(prop, actual, subset, pieceProp) {
    const thing = pieceProp ? `The ${pieceProp}` : 'It';
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
    const validOptions = stylelint.utils.validateOptions(postcssResult, ruleName);
    if (!validOptions) {
      return;
    }

    postcssRoot.walkDecls(decl => {
      const rootConfig = getSubsetConfig(config, decl);
      const subset = rootConfig ? rootConfig.subsets[decl.prop] : undefined;

      // Try alternates, maybe this rule is made up of multiple rules, like `border`.
      if (!subset) {
        const alternates = subsetMap[decl.prop];

        if (alternates) {
          const parsed = valueParser(decl.value);
          const values: string[] = [];

          parsed.walk((item: ValueParserNode) => {
            if (item.type === 'word') {
              values.push(item.value);
            }
          });

          mapSubset(alternates, decl.prop, decl.value).forEach((alt, index) => {
            const subset = config.subsets[alt];
            const value = values[index];

            checkValueAgainstSubset(decl, { prop: decl.prop, value: decl.value }, value, subset, postcssResult, alt);
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
  postcssResult: stylelint.PostcssResult
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
  postcssResult: stylelint.PostcssResult,
  altProp?: string
) {
  if (typeof subset === 'function') {
    subset = subset(message.prop, message.value);
  }
  if (Array.isArray(subset)) {
    const parsed = valueParser(value);
    const words = parsed.nodes.filter(
      (node: ValueParserNode) => node.type === 'word'
    );
    
    console.log(words);

    const valueNotInSubset = words.some((node: ValueParserNode) => {
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
