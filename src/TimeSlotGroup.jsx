import React, { PropTypes, Component } from 'react'
import TimeSlot from './TimeSlot'
import dates from './utils/dates.js'
import localizer from './localizer'

export default class TimeSlotGroup extends Component {
  static propTypes = {
    slots: PropTypes.array.isRequired,
    showLabels: PropTypes.bool,
    isNow: PropTypes.bool,
  }
  static defaultProps = {
    isNow: false,
    showLabels: false
  }

  renderSlots() {
    return this.props.slots.map((slot, i) => {
      return <TimeSlot key={i} slotInfo={slot} showLabel={this.props.showLabels && !i} isNow={this.props.isNow} />
    })
  }

  render() {
    return (
      <div className="rbc-timeslot-group">
        {this.renderSlots()}
      </div>
    )
  }
}
