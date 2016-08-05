import React from 'react';
import { findDOMNode } from 'react-dom';
import cn from 'classnames';
import { segStyle } from './utils/eventLevels';
import { notify } from './utils/helpers';
import { dateCellSelection, slotWidth, getCellAtX, pointInBox } from './utils/selection';
import Selection, { getBoundsForNode } from './Selection';

class DisplayCells extends React.Component {

  static propTypes = {
    selectable: React.PropTypes.bool,
    onBackgroundClick: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    slots: React.PropTypes.number
  }

  state = { selecting: false }

  componentDidMount(){
    if (this.props.selectable || this.props.onBackgroundClick) {
      const backgroundClickOnly = this.props.selectable ? false : true
      this._selectable(backgroundClickOnly)
    }
  }

  componentWillUnmount() {
    this._teardownSelectable();
  }

  componentWillReceiveProps(nextProps) {
    if ((nextProps.selectable || nextProps.onBackgroundClick) && !(this.props.selectable || this.props.onBackgroundClick)) {
      const backgroundClickOnly = nextProps.selectable ? false : true
      // Will this work since _selectable makes reference to this.props which at this stage is the previous ones?
      this._selectable(backgroundClickOnly)
    }
    if (!(nextProps.selectable || nextProps.onBackgroundClick) && (this.props.selectable || this.props.onBackgroundClick))
      this._teardownSelectable();
  }

  render(){
    let { slots } = this.props;
    let { selecting, startIdx, endIdx } = this.state

    let children = [];

    for (var i = 0; i < slots; i++) {
      children.push(
        <div
          key={'bg_' + i}
          style={segStyle(1, slots)}
          className={cn('rbc-day-bg', {
            'rbc-selected-cell': selecting && i >= startIdx && i <= endIdx
          })}
        />
      )
    }

    return (
      <div className='rbc-row-bg'>
        { children }
      </div>
    )
  }

  _selectable(backgroundClickOnly){
    let node = findDOMNode(this);
    let selector = this._selector = new Selection(this.props.container)

    if (backgroundClickOnly) {
      selector
        .on('click', point => {
          this.props.onBackgroundClick(point)
        })
      return
    }

    selector.on('selecting', box => {
      let { slots } = this.props;

      let startIdx = -1;
      let endIdx = -1;

      if (!this.state.selecting) {
        notify(this.props.onSelectStart, [box]);
        this._initial = { x: box.x, y: box.y };
      }
      if (selector.isSelected(node)) {
        let nodeBox = getBoundsForNode(node);

        ({ startIdx, endIdx } = dateCellSelection(
            this._initial
          , nodeBox
          , box
          , slots));
      }

      this.setState({
        selecting: true,
        startIdx, endIdx
      })
    })

    selector
      .on('click', point => {
        this.props.onBackgroundClick && this.props.onBackgroundClick(point);
        let rowBox = getBoundsForNode(node)

        if (pointInBox(rowBox, point)) {
          let width = slotWidth(getBoundsForNode(node),  this.props.slots);
          let currentCell = getCellAtX(rowBox, point.x, width);

          this._selectSlot({
            startIdx: currentCell,
            endIdx: currentCell
          })
        }

        this._initial = {}
        this.setState({ selecting: false })
      })

    selector
      .on('select', () => {
        this._selectSlot(this.state)
        this._initial = {}
        this.setState({ selecting: false })
        notify(this.props.onSelectEnd, [this.state]);
      })
  }

  _teardownSelectable() {
    if (!this._selector) return
    this._selector.teardown();
    this._selector = null;
  }

  _selectSlot({ endIdx, startIdx }) {
    this.props.onSelectSlot &&
      this.props.onSelectSlot({
        start: startIdx, end: endIdx
      })
  }
}

export default DisplayCells;
