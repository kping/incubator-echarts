define(function(require) {

    var VisualMapView = require('./VisualMapView');
    var zrUtil = require('zrender/core/util');
    var graphic = require('../../util/graphic');
    var symbolCreators = require('../../util/symbol');
    var layout = require('../../util/layout');

    var PiecewiseVisualMapView = VisualMapView.extend({

        type: 'visualMap.piecewise',

        /**
         * @protected
         * @override
         */
        doRender: function () {
            var thisGroup = this.group;

            thisGroup.removeAll();

            var visualMapModel = this.visualMapModel;
            var api = this.api;
            var ecWidth = api.getWidth();
            var textGap = visualMapModel.get('textGap');
            var textStyleModel = visualMapModel.textStyleModel;
            var textFont = textStyleModel.getFont();
            var textFill = textStyleModel.getTextColor();
            var itemAlign = this.getItemAlignByOrient('horizontal', ecWidth);
            var itemSize = visualMapModel.itemSize;

            var viewData = this._getViewData();
            var showLabel = !viewData.endsText;
            var showEndsText = !showLabel;

            showEndsText && this._renderEndsText(thisGroup, viewData.endsText[1], itemSize);

            zrUtil.each(viewData.pieceList, renderItem, this);

            showEndsText && this._renderEndsText(thisGroup, viewData.endsText[0], itemSize);

            layout.box(
                visualMapModel.get('orient'), thisGroup, visualMapModel.get('itemGap')
            );

            this.renderBackground(thisGroup);

            this.positionGroup(thisGroup);

            function renderItem(item) {
                var itemGroup = new graphic.Group();
                itemGroup.onclick = zrUtil.bind(this._onItemClick, this, item.index);

                this._createItemSymbol(itemGroup, item.piece, [0, 0, itemSize[0], itemSize[1]]);

                if (showLabel) {
                    itemGroup.add(new graphic.Text({
                        style: {
                            x: itemAlign === 'right' ? itemSize[0] + textGap : -textGap,
                            y: itemSize[1] / 2,
                            text: item.piece.text,
                            textBaseline: 'middle',
                            textAlign: itemAlign === 'right' ? 'left' : 'right',
                            textFont: textFont,
                            fill: textFill
                        }
                    }));
                }

                thisGroup.add(itemGroup);
            }
        },

        /**
         * @private
         */
        _renderEndsText: function (group, text, itemSize) {
            if (!text) {
                return;
            }
            var itemGroup = new graphic.Group();
            var textStyleModel = this.visualMapModel.textStyleModel;
            itemGroup.add(new graphic.Text({
                style: {
                    x: itemSize[0] / 2,
                    y: itemSize[1] / 2,
                    textBaseline: 'middle',
                    textAlign: 'center',
                    text: text,
                    textFont: textStyleModel.getFont(),
                    fill: textStyleModel.getTextColor()
                }
            }));

            group.add(itemGroup);
        },

        /**
         * @private
         * @return {Object} {peiceList, endsText} value order is [low, ..., high]
         */
        _getViewData: function () {
            var visualMapModel = this.visualMapModel;

            var pieceList = zrUtil.map(visualMapModel.getPieceList(), function (piece, index) {
                return {piece: piece, index: index};
            });
            var endsText = visualMapModel.get('text');

            // Consider orient and inverse.
            var orient = visualMapModel.get('orient');
            var inverse = visualMapModel.get('inverse');

            if (orient === 'horizontal' ? inverse : !inverse) {
                // Value order of pieceList is [high, ..., low]
                pieceList.reverse();
                // Value order of endsText is [high, low]
                if (endsText) {
                    endsText = endsText.slice().reverse();
                }
            }

            return {pieceList: pieceList, endsText: endsText};
        },

        /**
         * @private
         */
        _createItemSymbol: function (group, piece, shapeParam) {
            var representValue;
            if (this.visualMapModel.isCategory()) {
                representValue = piece.value;
            }
            else {
                var pieceInterval = piece.interval || [];
                representValue = (pieceInterval[0] + pieceInterval[1]) / 2;
            }

            var visualObj = this.getControllerVisual(representValue);

            group.add(symbolCreators.createSymbol(
                visualObj.symbol,
                shapeParam[0], shapeParam[1], shapeParam[2], shapeParam[3],
                visualObj.color
            ));
        },

        /**
         * @private
         */
        _onItemClick: function (index) {
            var visualMapModel = this.visualMapModel;
            var selected = zrUtil.clone(visualMapModel.get('selected'));

            if (visualMapModel.get('selectedMode') === 'single') {
                zrUtil.each(selected, function (item, index) {
                    selected[index] = false;
                });
            }
            selected[index] = !selected[index];

            this.api.dispatchAction({
                type: 'selectDataRange',
                from: this.uid,
                visualMapId: this.visualMapModel.id,
                selected: selected
            });
        }
    });

    return PiecewiseVisualMapView;
});
