from django.shortcuts import render, redirect, get_object_or_404
from django.db import models
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth import authenticate, login, logout

from .models import Producto, Movimiento


@login_required(login_url='login')
def inicio(request):

    productos = Producto.objects.filter(
        activo=True
    )

    total_productos = productos.count()

    productos_stock_bajo_lista = productos.filter(
        stock_actual__lte=models.F('stock_minimo')
    ).order_by('nombre')

    productos_stock_bajo = productos_stock_bajo_lista.count()

    total_movimientos = Movimiento.objects.count()

    ultimos_movimientos = Movimiento.objects.select_related(
        'producto',
        'usuario'
    ).order_by('-fecha_movimiento')[:5]

    contexto = {
        'total_productos': total_productos,
        'productos_stock_bajo': productos_stock_bajo,
        'productos_stock_bajo_lista': productos_stock_bajo_lista,
        'total_movimientos': total_movimientos,
        'ultimos_movimientos': ultimos_movimientos,
    }

    return render(
        request,
        'inventario/inicio.html',
        contexto
    )


@login_required(login_url='login')
def productos(request):

    consulta = request.GET.get(
        'q',
        ''
    ).strip()

    productos = Producto.objects.filter(
        activo=True
    )

    if consulta:
        productos = productos.filter(
            nombre__icontains=consulta
        )

    productos = productos.order_by(
        'nombre'
    )

    contexto = {
        'productos': productos,
        'consulta': consulta,
    }

    return render(
        request,
        'inventario/productos.html',
        contexto
    )


@login_required(login_url='login')
@permission_required(
    'inventario.add_producto',
    raise_exception=True
)
def nuevo_producto(request):

    if request.method == 'POST':

        nombre = request.POST.get(
            'nombre',
            ''
        ).strip()

        descripcion = request.POST.get(
            'descripcion',
            ''
        ).strip()

        unidad_medida = request.POST.get(
            'unidad_medida',
            ''
        ).strip()

        stock_actual = request.POST.get(
            'stock_actual',
            ''
        ).strip()

        stock_minimo = request.POST.get(
            'stock_minimo',
            ''
        ).strip()

        errores = []

        if not nombre:
            errores.append(
                'El nombre del producto es obligatorio.'
            )

        if not unidad_medida:
            errores.append(
                'La unidad de medida es obligatoria.'
            )

        if not stock_actual:
            errores.append(
                'El stock actual es obligatorio.'
            )

        if not stock_minimo:
            errores.append(
                'El stock mínimo es obligatorio.'
            )

        if not errores:

            try:

                producto = Producto(
                    nombre=nombre,
                    descripcion=descripcion,
                    unidad_medida=unidad_medida,
                    stock_actual=stock_actual,
                    stock_minimo=stock_minimo,
                )

                producto.full_clean()
                producto.save()

                return redirect(
                    'productos'
                )

            except Exception:

                errores.append(
                    'No fue posible registrar el producto. '
                    'Verifica los valores ingresados.'
                )

        contexto = {
            'errores': errores,
            'nombre': nombre,
            'descripcion': descripcion,
            'unidad_medida': unidad_medida,
            'stock_actual': stock_actual,
            'stock_minimo': stock_minimo,
        }

        return render(
            request,
            'inventario/nuevo_producto.html',
            contexto
        )

    return render(
        request,
        'inventario/nuevo_producto.html'
    )


@login_required(login_url='login')
@permission_required(
    'inventario.change_producto',
    raise_exception=True
)
def editar_producto(
    request,
    producto_id
):

    producto = get_object_or_404(
        Producto,
        id=producto_id,
        activo=True
    )

    if request.method == 'POST':

        nombre = request.POST.get(
            'nombre',
            ''
        ).strip()

        descripcion = request.POST.get(
            'descripcion',
            ''
        ).strip()

        unidad_medida = request.POST.get(
            'unidad_medida',
            ''
        ).strip()

        stock_minimo = request.POST.get(
            'stock_minimo',
            ''
        ).strip()

        errores = []

        if not nombre:
            errores.append(
                'El nombre del producto es obligatorio.'
            )

        if not unidad_medida:
            errores.append(
                'La unidad de medida es obligatoria.'
            )

        if not stock_minimo:
            errores.append(
                'El stock mínimo es obligatorio.'
            )

        if not errores:

            try:

                producto.nombre = nombre
                producto.descripcion = descripcion
                producto.unidad_medida = unidad_medida
                producto.stock_minimo = stock_minimo

                producto.full_clean()
                producto.save()

                return redirect(
                    'productos'
                )

            except Exception:

                errores.append(
                    'No fue posible actualizar el producto. '
                    'Verifica los valores ingresados.'
                )

        contexto = {
            'producto': producto,
            'errores': errores,
            'nombre': nombre,
            'descripcion': descripcion,
            'unidad_medida': unidad_medida,
            'stock_minimo': stock_minimo,
        }

        return render(
            request,
            'inventario/editar_producto.html',
            contexto
        )

    contexto = {
        'producto': producto,
    }

    return render(
        request,
        'inventario/editar_producto.html',
        contexto
    )


@login_required(login_url='login')
@permission_required(
    'inventario.add_movimiento',
    raise_exception=True
)
def registrar_entrada(
    request,
    producto_id
):

    producto = get_object_or_404(
        Producto,
        id=producto_id,
        activo=True
    )

    if request.method == 'POST':

        cantidad = request.POST.get(
            'cantidad',
            ''
        ).strip()

        observacion = request.POST.get(
            'observacion',
            ''
        ).strip()

        errores = []

        if not cantidad:
            errores.append(
                'La cantidad es obligatoria.'
            )

        if not errores:

            try:

                movimiento = Movimiento(
                    producto=producto,
                    usuario=request.user,
                    tipo_movimiento='ENTRADA',
                    cantidad=cantidad,
                    observacion=observacion
                )

                movimiento.save()

                return redirect(
                    'productos'
                )

            except Exception as e:

                errores.append(
                    str(e)
                )

        contexto = {
            'producto': producto,
            'errores': errores,
            'cantidad': cantidad,
            'observacion': observacion,
        }

        return render(
            request,
            'inventario/registrar_entrada.html',
            contexto
        )

    contexto = {
        'producto': producto,
    }

    return render(
        request,
        'inventario/registrar_entrada.html',
        contexto
    )


@login_required(login_url='login')
@permission_required(
    'inventario.add_movimiento',
    raise_exception=True
)
def registrar_salida(
    request,
    producto_id
):

    producto = get_object_or_404(
        Producto,
        id=producto_id,
        activo=True
    )

    if request.method == 'POST':

        cantidad = request.POST.get(
            'cantidad',
            ''
        ).strip()

        observacion = request.POST.get(
            'observacion',
            ''
        ).strip()

        errores = []

        if not cantidad:
            errores.append(
                'La cantidad es obligatoria.'
            )

        if not errores:

            try:

                movimiento = Movimiento(
                    producto=producto,
                    usuario=request.user,
                    tipo_movimiento='SALIDA',
                    cantidad=cantidad,
                    observacion=observacion
                )

                movimiento.save()

                return redirect(
                    'productos'
                )

            except Exception as e:

                errores.append(
                    str(e)
                )

        contexto = {
            'producto': producto,
            'errores': errores,
            'cantidad': cantidad,
            'observacion': observacion,
        }

        return render(
            request,
            'inventario/registrar_salida.html',
            contexto
        )

    contexto = {
        'producto': producto,
    }

    return render(
        request,
        'inventario/registrar_salida.html',
        contexto
    )


@login_required(login_url='login')
def movimientos(request):

    producto_busqueda = request.GET.get(
        'producto',
        ''
    ).strip()

    tipo = request.GET.get(
        'tipo',
        ''
    ).strip()

    usuario_busqueda = request.GET.get(
        'usuario',
        ''
    ).strip()

    movimientos = Movimiento.objects.select_related(
        'producto',
        'usuario'
    )

    if producto_busqueda:

        movimientos = movimientos.filter(
            producto__nombre__icontains=producto_busqueda
        )

    if tipo in ['ENTRADA', 'SALIDA']:

        movimientos = movimientos.filter(
            tipo_movimiento=tipo
        )

    if usuario_busqueda:

        movimientos = movimientos.filter(
            usuario__username__icontains=usuario_busqueda
        )

    movimientos = movimientos.order_by(
        '-fecha_movimiento'
    )

    usuarios = (
        Movimiento.objects
        .select_related('usuario')
        .values(
            'usuario__id',
            'usuario__username'
        )
        .distinct()
        .order_by('usuario__username')
    )

    contexto = {
        'movimientos': movimientos,
        'producto_busqueda': producto_busqueda,
        'tipo': tipo,
        'usuario_busqueda': usuario_busqueda,
        'usuarios': usuarios,
    }

    return render(
        request,
        'inventario/movimientos.html',
        contexto
    )


def iniciar_sesion(request):

    if request.user.is_authenticated:
        return redirect(
            'inicio'
        )

    if request.method == 'POST':

        usuario = request.POST.get(
            'usuario'
        )

        contraseña = request.POST.get(
            'contraseña'
        )

        usuario_autenticado = authenticate(
            request,
            username=usuario,
            password=contraseña
        )

        if usuario_autenticado is not None:

            login(
                request,
                usuario_autenticado
            )

            return redirect(
                'inicio'
            )

        return render(
            request,
            'inventario/login.html',
            {
                'error': (
                    'El usuario o la contraseña '
                    'son incorrectos.'
                )
            }
        )

    return render(
        request,
        'inventario/login.html'
    )


def cerrar_sesion(request):

    logout(request)

    return redirect(
        'login'
    )