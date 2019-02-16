const Veact = {
  render: (component, DOMEleToAppend, DOMEleToReplace) => {
    if (DOMEleToAppend !== undefined) {
      if (Veact.currTree) {
        Veact.prevTree = Veact.currTree;
      }

      Veact.currTree = component;
      
      if (!DOMEleToAppend.firstChild) {
        return DOMEleToAppend.appendChild(Veact.render(component));
      }

      return DOMEleToAppend.replaceChild(Veact.render(component), DOMEleToReplace);
    }

    const domEl = document.createElement(component.tag);
    component.dom = domEl;
    
    // adds attributes, including style properties and event listeners
    updateDOMElAttributes(domEl, component);

    // adds the children component to the element, using a recursive call
    // to Veact.render method.
    component.children.forEach((child) => {
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
  },

  createElement: (tag, props, ...children) => {
    if (typeof tag === 'function') {
      // if we are trying to create a element from a <Component />, we need
      // to call its render function and pass the props to the constructor
      const element = new tag(props);
      const veactComponent = element.render();
      veactComponent.veactRef = element;
      element.__componentRef = veactComponent;

      return veactComponent;
    }

    return new VeactComponent(tag, props, children);
  },

  Component: class Component {
    constructor(props, state = {}) {
      this.props = props;
      this.state = state;
    }

    setState(newState) {
      // update the state
      const updatedState = Object.assign({}, this.state, newState);

      // create a new instance of whatever class this is an instance of.
      // we need to do this to get a VeactComponent with the new props / state
      const newTagInstance = new this.constructor(this.props);
      newTagInstance.state = updatedState;
      const newVeactComponent = newTagInstance.render();

      // creates circular references
      newVeactComponent.veactRef = newTagInstance;
      newTagInstance.__componentRef = newVeactComponent;

      // render updated component to page
      Veact.render(
        newVeactComponent, 
        this.__componentRef.dom.parentElement, 
        this.__componentRef.dom);
    }
  },
};

class VeactComponent {
  constructor(tag, props, children = [], veactRef = null) {
    const childrenFiltered = children
      .filter(el => el !== undefined && el !== null)
      .map(el => !(el instanceof VeactComponent) && tag !== 'TEXT NODE' ?
        new VeactComponent('TEXT NODE', null, [el]) : el);

    this.tag = tag.trim();
    this.props = props;
    this.children = childrenFiltered;
    this.veactRef = veactRef;
  }
}

// ---------------------------------------------------- //
// ------------- HELPER FUNCTIONS --------------------- //
// ---------------------------------------------------- //
function updateDOMElAttributes(domEl, component) {
  const keys = component.props ? Object.keys(component.props) : [];
  for (let i = 0; i < keys.length; i += 1) {
    const att = keys[i];
    if (att.startsWith('on') && att[2].toUpperCase() === att[2]
      && typeof component.props[att] === 'function') {
      domEl.addEventListener(att.slice(2).toLowerCase(), component.props[att]);
    } else if (att === 'style') {
      const styleObj = component.props.style;
      let styleStr = '';
      for (let key of Object.keys(styleObj)) {
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

  return domEl;
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

export default Veact;
