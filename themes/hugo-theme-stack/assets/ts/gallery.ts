class StackGallery {
    private galleryUID: number;

    constructor(container: HTMLElement, galleryUID = 1) {

        StackGallery.createGallery(container);
    }

    public static createGallery(container: HTMLElement) {
        
        const figuresEl = container.querySelectorAll('figure');

        let currentGallery = [];

        for (const figure of figuresEl) {
            if (!currentGallery.length) {
                /// First iteration
                currentGallery = [figure];
            }
            else if (figure.previousElementSibling === currentGallery[currentGallery.length - 1]) {
                /// Adjacent figures
                currentGallery.push(figure);
            }
            else if (currentGallery.length) {
                /// End gallery
                StackGallery.wrap(currentGallery);
                currentGallery = [figure];
            }
        }

        if (currentGallery.length > 0) {
            StackGallery.wrap(currentGallery);
        }
    }

    /**
     * Wrap adjacent figure tags with div.gallery
     * @param figures 
     */
    public static wrap(figures: HTMLElement[]) {
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'gallery';

        const parentNode = figures[0].parentNode,
            first = figures[0];

        parentNode.insertBefore(galleryContainer, first)

        for (const figure of figures) {
            galleryContainer.appendChild(figure);
        }
    }

}

export default StackGallery;