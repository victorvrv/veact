class VeactClass {
    constructor(props) {
        this.props = props;
    }

    render(component, DOMEleToAppend) {
        if (DOMEleToAppend !== undefined) {
            if (!Veact.currTree) {
                Veact.currTree = component;
                return DOMEleToAppend.appendChild(Veact.render(component));
            }
            
            Veact.prevTree = Veact.currTree;
            Veact.currTree = component;
        }

        const domEl = document.createElement(component.tag);
        component.dom = domEl;

        // adds attributes, including style properties and event listeners
        for (let att in component.props) {
            if (att.startsWith('on') && att[2].toUpperCase() === att[2]
                && typeof component.props[att] === 'function') {
                domEl.addEventListener(att.slice(2).toLowerCase(), component.props[att]);
            } else if (att === 'style') {
                const styleObj = component.props.style;
                let styleStr = '';
                for (let key in styleObj) {
                    // check if its a camel-cased property
                    styleStr += `${getRealStylePropName(key)}:${styleObj[key]};`;
                }

                domEl.style = styleStr;
            } else {
                // the syntax below ignores non-std att and prevents them from being
                // added to the element.
                domEl[att] = component.props[att];
            }
        }

        // adds the children component to the element, using a recursive call
        // to Veact.render method.
        component.children.forEach(child => {
            if (child.tag === "TEXT NODE") {
                const textContent = child.children
                    .reduce((accm, curr) => accm += curr, '');
                const textEl = document.createTextNode(textContent);
                domEl.appendChild(textEl);
            } else {
                domEl.appendChild(Veact.render(child));
            }
        });

        return domEl;
    }

    createElement(tag, props, ...children) {
        if (typeof tag === "function") {
            // if we are trying to create a element from a <Component />, we need
            // to call its render function and pass the props to the constructor
            return (new tag(props)).render();
        }

        return new VeactComponent(tag, props, children);
    }

    setState() {
        return;
    }
}

class VeactComponent {
    constructor(tag, props, children) {
        const childrenFiltered = children
            .filter(el => el !== undefined && el !== null)
            .map(el => !(el instanceof VeactComponent) && tag !== 'TEXT NODE' ?
                new VeactComponent('TEXT NODE', null, [el]) : el);

        this.tag = tag.trim();
        this.props = props;
        this.children = childrenFiltered;
    }
}


function getRealStylePropName(propName) {
    // formats a style property name from camelCase to 
    // dash separated. fontSize to font-size
    if (propName === propName.toLowerCase()) return propName;

    let realStyleAtt = '';
    for (let char of propName) {
        if (char.toLowerCase() === char) {
            realStyleAtt += char;
        } else {
            realStyleAtt += '-' + char.toLowerCase();
        }
    }
    return realStyleAtt;
}

const Veact = new VeactClass();