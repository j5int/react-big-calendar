import React, { PropTypes, Component } from 'react'
import cn from 'classnames'

export default class TimeSlot extends Component {
  static propTypes = {
    slotInfo: PropTypes.object.isRequired,
    isNow: PropTypes.bool,
    showLabel: PropTypes.bool,
  }

  static defaultProps = {
    isNow: false,
    showLabel: false,
  }

  render() {
    const slotLabel = this.props.slotInfo.slotLabel
    return (
      <div
        className={cn(
          'rbc-time-slot',
          {
          'rbc-label': this.props.showLabel,
          'rbc-now': this.props.isNow
          }
        )}
      >
      {this.props.showLabel &&
        <span>{slotLabel}</span>
      }
      </div>
    )
  }
}
