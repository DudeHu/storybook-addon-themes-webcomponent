import addons, { Listener } from '@storybook/addons';

import { CHANGE } from '../constants';
import { DecoratorProps, Theme, ThemeConfig } from '../models';
import { getSelectedTheme, getSelectedThemeName } from '../shared';

import { getHtmlClasses } from './shared';
import { html, TemplateResult } from 'lit-html'

const channel = addons.getChannel();

let prevCallback: Listener;
function subscribe(callback: Listener) {
  if (prevCallback) {
    channel.removeListener(CHANGE, prevCallback);
  }
  if (callback) {
    channel.on(CHANGE, callback);
  }
  prevCallback = callback;
}

function createCallback(list: Theme[], callback: Function) {
  return (themeName: string) => {
    const theme = getSelectedTheme(list, themeName);
    const themeClasses = getHtmlClasses(theme);
    callback({theme, themes: list, themeClasses, themeName});
  }
}

export function ThemeDecorator(config: ThemeConfig, element: string|Node) {
  const { Decorator, list, default: defaultTheme } = config;
  const lastValue = channel.last(CHANGE);
  const themeName = (lastValue && lastValue[0]) || getSelectedThemeName(list, defaultTheme);
  const theme = getSelectedTheme(list, themeName);
  const themeClasses = getHtmlClasses(theme);

  let wrapper: HTMLElement | TemplateResult;

  const setAttrs = (ele: HTMLElement) => {
    ele.setAttribute('class', themeClasses);
    subscribe(createCallback(list, ({ themeClasses }: DecoratorProps) => ele.setAttribute('class', themeClasses)));
  }

  if(element instanceof Node) {
    wrapper =  document.createElement('div');
    wrapper.appendChild(element)
    setAttrs(wrapper);
  } else if(typeof element === 'string') {
    wrapper = document.createElement('div');
    wrapper.innerHTML = element;
    setAttrs(wrapper);
  } else {
    wrapper = element;
  }

  if (Decorator) {
    // @ts-ignore
    const [decorator, callback] = Decorator({children: wrapper, theme, themes: list, themeClasses, themeName});
    subscribe(createCallback(list, callback));
    return decorator;
  }
  return wrapper;
}
