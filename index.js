const types = require('@babel/types');
const parser = require('@babel/parser');

const {
    isReturnStatement, isMemberExpression, isIdentifier,
    isNullLiteral, isObjectExpression, isStringLiteral
} = types;

/** 前命令执行所在路径（执行 npm start 所在的文件路径） */
const BASE_DIR_PATH = process.cwd();

/**
 * 判断是否是 React.Fragment
 */
function isReactFragment(path) {
    if (!path.node || !path.node.arguments) {
        return false;
    }

    const [element] = path.node.arguments;

    return isMemberExpression(element) &&
        isIdentifier(element.object, { name: 'React' }) &&
        isIdentifier(element.property, { name: 'Fragment' });
}

/**
 * 判断是否是直接 return <></>
 */
function isRootReactFragment(path) {
    return isReactFragment(path) && isReturnStatement(path.parent);
}

module.exports = function() {
    return {
        visitor: {
            CallExpression(path, state) {
                // 只对开发时生效
                if (process.env.NODE_ENV === 'production') {
                    return;
                }

                const { callee } = path.node;
                const isReactCreateElement = isMemberExpression(callee) &&
                    isIdentifier(callee.object, { name: 'React' }) &&
                    isIdentifier(callee.property, { name: 'createElement' });
                
                // ① 过滤掉非 React.createElement
                // ② 过滤掉 React.Fragment
                if (!isReactCreateElement || isReactFragment(path)) {
                    return;
                }

                // ③ 过滤掉直接父节点不是 return 语句
                // ④ 过滤掉直接父节点不是 return <></>
                if (!(isReturnStatement(path.parent) ? true : isRootReactFragment(path.parentPath))) {
                    return;
                }

                // 获取元素和属性
                const [element, propsExpression] = path.node.arguments;

                // 只对 HTML 原生节点做路径添加逻辑
                if (!isStringLiteral(element)) {
                    return;
                }

                // 自定义属性对象
                const extraProps = {};
                const sorucePath = state.file.opts.filename.replace(BASE_DIR_PATH, '');

                // 具体挂载的属性名称，默认 `data-source`
                if (state.opts.fieldName) {
                    extraProps[String(state.opts.fieldName)] = sorucePath;
                } else {
                    extraProps['data-source'] = sorucePath;
                }

                // 将自定义属性转化为 PropsExpression
                const extraPropsExpression = parser.parseExpression(JSON.stringify(extraProps));

                // 如果为当前原属性为空，则直接将自定义属性赋值给当前节点
                if (isNullLiteral(propsExpression)) {
                    path.node.arguments[1] = extraPropsExpression;
                    return;
                }

                // 如果当前存在对象属性
                if (isObjectExpression(propsExpression)) {
                    path.node.arguments[1] = types.objectExpression(
                        [...propsExpression.properties, ...extraPropsExpression.properties]
                    );
                }
                
            }
        }
    };
}