/*
================================================================================
File: tests/component-tests/AppIcon.test.js
Description: Tests the semantic icon wrapper and its accessibility contract.
Author: Sheng-Wei Chang
License: MIT (SPDX: MIT)
Created: 2026-10-24
================================================================================
*/

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppIcon from '../../source/components/AppIcon.vue';

describe('AppIcon', () => {
  // Test Case 1: Should render the mapped template-library icon at the navigation size
  it('renders the mapped template-library icon at the navigation size', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'templateLibrary', size: 'navigation' },
    });

    expect(wrapper.find('svg').classes()).toContain('size-6');
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('svg').attributes('focusable')).toBe('false');
  });

  // Test Case 2: Should render a labelled non-decorative icon for assistive technology
  it('renders a labelled non-decorative icon without hiding it from assistive technology', () => {
    const wrapper = mount(AppIcon, {
      props: { decorative: false, label: 'Template library', name: 'templateLibrary' },
    });

    expect(wrapper.find('svg').attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.find('svg').attributes('aria-label')).toBe('Template library');
    expect(wrapper.find('svg').attributes('role')).toBe('img');
  });

  // Test Case 3: Should keep an unlabelled non-decorative icon hidden from assistive technology
  it('keeps an unlabelled non-decorative icon hidden from assistive technology', () => {
    const wrapper = mount(AppIcon, {
      props: { decorative: false, name: 'templateLibrary' },
    });

    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('svg').attributes('aria-label')).toBeUndefined();
    expect(wrapper.find('svg').attributes('role')).toBeUndefined();
  });

  // Test Case 4: Should use the compact size token for dense controls
  it('uses the compact size token for dense controls', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'add', size: 'compact' },
    });

    expect(wrapper.find('svg').classes()).toContain('size-3.5');
  });
});
