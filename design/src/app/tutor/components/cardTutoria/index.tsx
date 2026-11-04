import styles from './styles.module.scss'
import { Card } from '@/components/card'
import { Botao } from '@/components/botao'

// Card "Minha tutoria" (print 1): só o atalho para a página Tutoria, onde fica a lista de tutorados
export function CardTutoria(){
    return (
        <Card titulo="Minha tutoria">
            <div className={styles.corpo}>
                <Botao variante="secundario" href="/tutor/tutoria">Ver seus tutorados</Botao>
            </div>
        </Card>
    )
}
