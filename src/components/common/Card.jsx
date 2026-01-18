import './Card.css';

function Card({ children, className = '', onClick, ...props }) {
    const classes = ['card', onClick && 'card-clickable', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    );
}

export default Card;
