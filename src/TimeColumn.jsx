import React, { Component, PropTypes } from 'react'
import cn from 'classnames';

import dates from './utils/dates';

import TimeSlotGroup from './TimeSlotGroup'

export default class TimeColumn extends Component {
  static propTypes = {
    step: PropTypes.number.isRequired,
    timeslots: PropTypes.number.isRequired, // I'd like to deprecate this: It's confusing.
    now: PropTypes.instanceOf(Date).isRequired,
    slotCollection: PropTypes.object,
    showLabels: PropTypes.bool,
    type: PropTypes.string.isRequired,
    className: PropTypes.string
  }
  static defaultProps = {
    step: 30,
    timeslots: 2,
    showLabels: false,
    type: 'day',
    className: ''
  }

  renderTimeSliceGroup(key, isNow, slots) {
    return (
      <TimeSlotGroup
        key={key}
        isNow={isNow}
        showLabels={this.props.showLabels}
        slots={slots}
      />
    )
  }

  render() {
    const totalSlots = this.props.slotCollection.slots.length
    const numSlotsPerGroup = this.props.timeslots

    const timeslots = []
    let isNow = false

    for (var i = 0; i < totalSlots; i+=numSlotsPerGroup) {
      const slotSlice = this.props.slotCollection.slots.slice(i, i + numSlotsPerGroup)
      timeslots.push(this.renderTimeSliceGroup(i, isNow, slotSlice))
    }

    return (
      <div
        className={cn(this.props.className, 'rbc-time-column')}
        style={this.props.style}
      >
        {timeslots}
        {this.props.children}
      </div>
    )
  }
}
