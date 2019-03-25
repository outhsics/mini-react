import $ from 'jquery';
class Unit{
    constructor(element){
        this._currentElement = element;
    }
}
class ReactTextUnit extends Unit{
    getMarkup(rootId){
       this._rootId = rootId;
       return `<span data-reactid="${rootId}">${this._currentElement}</span>`;
    }
}
class ReactNativeUnit extends Unit{
    getMarkup(rootId){
        this._rootId = rootId;
        let {type,props} = this._currentElement;
        let tagStart = `<${type} data-reactid="${rootId}" `;
        let childString = '';
        let tagEnd = `</${type}>`;
        for(let propKey in props){
            if(/^on[A-Z]/.test(propKey)){//如果匹配说明要绑定事件
                let eventType = propKey.slice(2).toLowerCase();
                $(document).delegate(`[data-reactid="${rootId}"]`,eventType,props[propKey]);
            }else if(propKey === 'children'){
                let children = props.children ||[];
                childString = children.map((child,index)=>{
                    let childReactUnit = createReactUnit(child);
                    let childMarkup = childReactUnit.getMarkup(`${rootId}.${index}`);
                    return childMarkup;
                }).join('');
            }else{
                tagStart += (' '+propKey+'='+props[propKey]);
            }
        }
        return tagStart+'>'+childString+tagEnd;
        //<button id="sayHello">say<b>Hello</b></button>
        //<button id="sayHello">say<b>Hello</b></button>
        //return '<button id="sayHello">say<b>Hello</b></button>';
    }
}
class ReactCompositeUnit extends Unit{
    //自定义组件渲染的内容是由什么决定的？render方法的返回值决定的，render方法的返回值是
    //一个虚拟DOM,Element的实例 ,但是最终肯定是落实到Native或Text上
    getMarkup(rootId){
        this._rootId = rootId;
        let {type:Component,props} = this._currentElement;//{type:Counter, props:{name:'我的计数器'})
        //先创建Counter组件的实例
        let componentInstance = this._componentInstance = new Component(props);
        //如果有组件将要挂载函数，就执行它
        componentInstance.componentWillMount&&componentInstance.componentWillMount();
        //调用render方法得到返回的虚拟DOM ，也就是React元素
        let renderedElement = componentInstance.render();
        //获取要渲染的单元实例
        let renderedUnitInstance =  createReactUnit(renderedElement);
        //获取对应的HTML字符串
        let renderedMarkup = renderedUnitInstance.getMarkup(rootId);
        $(document).on('mounted',()=>{
            componentInstance.componentDidMount&&componentInstance.componentDidMount()
        });
        return renderedMarkup
    }
}

//它是一个工厂方法，根据参数的参数生产不同的类型的实例，但一般来说这些实例都是同一个父类的子类
function createReactUnit(element){
    if(typeof element =='number' || typeof element == 'string'){
        return new ReactTextUnit(element);
    }
    // {type:'button',props:{}} 说明它是一个原生的DOM节点
    if(typeof element == 'object' &&  typeof element.type == 'string'){
        return new ReactNativeUnit(element);
    }
    if(typeof element == 'object' &&  typeof element.type == 'function'){
        return new ReactCompositeUnit(element);
    }

}
export default createReactUnit;