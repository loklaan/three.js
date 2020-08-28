import { UIPanel, UIRow, UIDiv, UIBreak, UIButton, UINumber, UIText } from './libs/ui.js';

function SidebarAnimation( editor ) {

	var signals = editor.signals;
	var mixer = editor.mixer;

	var actions = {};
	var actionElements = {};

	signals.objectSelected.add( function ( object ) {

		var animations = editor.animations[ object !== null ? object.uuid : '' ];

		if ( animations !== undefined ) {

			container.setDisplay( '' );

			var options = {};
			var firstAnimation;
			var allAnimations = [];

			for ( var animation of animations ) {

				var additiveAnimation = animation.clone();
				THREE.AnimationUtils.makeClipAdditive( additiveAnimation );

				if ( animation.name.endsWith( '_pose' ) ) {

					animation.name = animation.name + '::clipped';

					animation = THREE.AnimationUtils.subclip(
						animation,
						animation.name,
						1, 30, 30
					);

				}

				if ( additiveAnimation.name.endsWith( '_pose' ) ) {

					additiveAnimation.name = additiveAnimation.name + '::clipped';

					additiveAnimation = THREE.AnimationUtils.subclip(
						additiveAnimation,
						additiveAnimation.name,
						1, 30, 30
					);

				}

				additiveAnimation.name = additiveAnimation.name + '::add-blend';

				allAnimations.push( animation );
				allAnimations.push( additiveAnimation );

			}

			for ( var animation of allAnimations ) {

				if ( firstAnimation === undefined ) firstAnimation = animation.name;

				actions[ animation.name ] = mixer.clipAction( animation, object );
				options[ animation.name ] = animation.name;

				actions[ animation.name ].weight = 0;

				if ( ! actionElements[ animation.name ] ) {

					var row = new UIRow()
						.setMarginBottom( '10px' )
						.setStyle( 'display', [ 'flex' ] )
						.setStyle( 'align-items', [ 'stretch' ] );
					container.add( row );

					var leftDiv = new UIDiv()
						.setStyle( 'display', [ 'flex' ] )
						.setStyle( 'align-items', [ 'center' ] );

					var playButton = new UIButton( 'Play' )
						.setMargin( '0 12px 0 4px' )
						.setWidth( '55px' );
					playButton.onClick( playAction.bind( null, animation.name ) );
					leftDiv.add( playButton );

					var rightDiv = new UIDiv();

					rightDiv.add( new UIText( animation.name ) );

					var optionsDiv = new UIDiv().setMarginTop( '4px' );

					var weightDiv = null, weightNum = null;

					if ( animation.blendMode === THREE.AdditiveAnimationBlendMode ) {

						updateActionWeight( animation.name, 0 );

						weightDiv = new UIDiv().setMarginLeft( '4px' );
						weightDiv.add( new UIText( 'weight' ).setFontWeight( '300' ).setMarginRight( '6px' ) );
						weightNum = new UINumber( 0 ).setWidth( '50px' );
						weightNum.min = 0;
						weightNum.max = 1;
						weightNum.onChange( updateActionWeight.bind( null, animation.name ) );
						weightDiv.add( weightNum );

						optionsDiv.add( weightDiv );

					} else {

						row.setMarginBottom( '2px' );

					}


					rightDiv.add( optionsDiv );

					row.add( leftDiv );
					row.add( rightDiv );

					actionElements[ animation.name ] = {};
					actionElements[ animation.name ].playButton = playButton;
					actionElements[ animation.name ].weightDiv = weightDiv;
					actionElements[ animation.name ].weightNum = weightNum;

				}

			}

		} else {

			container.setDisplay( 'none' );

		}

		function getAction( name ) {

			return actions[ name ];

		}

		function playAction( name ) {

			var action = getAction( name );

			if ( action.isRunning() ) {

				updateActionWeight( name, 0 );
				if ( actionElements[ name ].weightNum ) {

					actionElements[ name ].weightNum.setValue( 0 );

				}


				action.stop();
				actionElements[ name ].playButton.setBackgroundColor( '' );
				actionElements[ name ].playButton.setTextContent( 'Play' );

			} else {

				action.enabled = true;
				action.play();
				actionElements[ name ].playButton.setBackgroundColor( '#165C99' );
				actionElements[ name ].playButton.setTextContent( 'Stop' );

				updateActionWeight( name, 1 );
				if ( actionElements[ name ].weightNum ) {

					actionElements[ name ].weightNum.setValue( 1 );

				}

			}

		}

		function updateActionWeight( name, overridingWeight ) {

			var action = getAction( name );
			var weight = typeof overridingWeight === 'number'
				? overridingWeight
				: actionElements[ name ].weightNum.getValue();
			action.weight = weight;
			action.enabled = true;
			action.setEffectiveTimeScale( 1 );
			action.setEffectiveWeight( weight );

		}

	} );

	signals.objectRemoved.add( function ( object ) {

		var animations = editor.animations[ object !== null ? object.uuid : '' ];

		if ( animations !== undefined ) {

			mixer.uncacheRoot( object );

		}

	} );

	var container = new UIPanel();
	container.setDisplay( 'none' );

	container.add( new UIText( 'Animations' ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak() );
	container.add( new UIBreak() );

	return container;

}

export { SidebarAnimation };
