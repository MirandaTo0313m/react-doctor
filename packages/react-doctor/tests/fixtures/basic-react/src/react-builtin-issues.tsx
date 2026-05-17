import React, { Component } from "react";
import ReactDOM from "react-dom";

// no-children-prop: passing children as a prop
const ChildrenAsProp = () => <div children="bad" />;

// no-danger: using dangerouslySetInnerHTML
const DangerousHtml = () => <div dangerouslySetInnerHTML={{ __html: "<b>bold</b>" }} />;

// jsx-no-duplicate-props: duplicate JSX props
const DuplicateProps = () => <div className="a" className="b" />;

// jsx-no-script-url: javascript: URL in href
const ScriptUrl = () => <a href="javascript:alert(1)">click</a>;

// jsx-key: missing key in .map()
const MissingKey = ({ items }: { items: string[] }) => (
  <ul>
    {items.map((item) => (
      <li>{item}</li>
    ))}
  </ul>
);

// no-string-refs: string ref attribute
class StringRefComponent extends Component {
  render() {
    return <input ref="myInput" />;
  }
}

// no-direct-mutation-state: mutating state outside constructor
class DirectMutateState extends Component {
  handleClick() {
    this.state.count = 1;
  }
  render() {
    return <button onClick={() => this.handleClick()}>click</button>;
  }
}

// no-render-return-value: using ReactDOM.render() return value
const instance = ReactDOM.render(<div />, document.getElementById("root"));

// no-unknown-property: using class instead of className
const UnknownProp = () => <div class="foo" />;

// rules-of-hooks: hook inside a conditional
const ConditionalHook = ({ flag }: { flag: boolean }) => {
  if (flag) {
    React.useState(0);
  }
  return null;
};

// no-is-mounted: using this.isMounted()
class IsMountedComponent extends Component {
  check() {
    if (this.isMounted()) {
      return true;
    }
    return false;
  }
  render() {
    return <div />;
  }
}

// require-render-return: missing return in render
class NoReturnRender extends Component {
  render() {
    const x = 1;
  }
}

export {
  ChildrenAsProp,
  DangerousHtml,
  DuplicateProps,
  ScriptUrl,
  MissingKey,
  StringRefComponent,
  DirectMutateState,
  UnknownProp,
  ConditionalHook,
  IsMountedComponent,
  NoReturnRender,
  instance,
};
