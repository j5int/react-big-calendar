import Calendar from './Calendar';
import { set as setLocalizer } from './localizer';
import momentLocalizer from './localizers/moment';
import globalizeLocalizer from './localizers/globalize';
import viewLabel from './utils/viewLabel';
import move from './utils/move';
import getViewRange from './utils/range';
import { views } from './utils/constants';

/*
We are exporting React and ReactDOM in this bundle since
there are issues having it loaded separately by the dojo loader
while it also exists in this bundle.
I tried to exclude it from the bundle, but without any luck.
There should be a way to do so, but for now,
we will continue to bundle it in here and export it.
 */
import React from 'react'
import ReactDOM from 'react-dom'

Object.assign(Calendar, {
  setLocalizer,
  globalizeLocalizer,
  momentLocalizer,
  label: viewLabel,
  views,
  move,
  getViewRange,
  React,
  ReactDOM,
})

export default Calendar
